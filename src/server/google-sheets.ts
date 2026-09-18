import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Order, OrderSubmissionResult } from '../lib/types.ts'

interface GoogleCredentials {
  clientEmail?: string
  privateKey?: string
  sheetId?: string
  sheetRange?: string
  webhookUrl?: string
}

/**
 * Normalize and sanitize a Google Service Account Private Key.
 * Handles common environment variable formatting issues:
 * - Surrounding quotes (single, double, or backticks)
 * - Escaped newlines (\\n, \\\\n, \\r)
 * - Base64 encoded private keys
 * - Missing or malformed PEM line-breaks
 * - Accidental pasting of the full JSON key into the private key variable
 */
export function normalizePrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined

  let key = rawKey.trim()

  // If the user pasted the entire service account JSON into GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (key.startsWith('{') || key.includes('"private_key"')) {
    try {
      const parsed = JSON.parse(key)
      if (parsed.private_key) {
        key = parsed.private_key
      }
    } catch {
      // not valid JSON, proceed as raw key
    }
  }

  // Strip surrounding quotes (e.g. from .env file or cloud dashboard quotes)
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'")) ||
    (key.startsWith('`') && key.endsWith('`'))
  ) {
    key = key.slice(1, -1).trim()
  }

  // Check if the entire key was base64 encoded (a common workaround in Vercel/Docker)
  if (!key.includes('BEGIN') && !key.includes('\n')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8').trim()
      if (decoded.includes('BEGIN') && decoded.includes('PRIVATE KEY')) {
        key = decoded
      }
    } catch {
      // not base64, keep original
    }
  }

  // Re-strip quotes if base64-decoded content had them
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'")) ||
    (key.startsWith('`') && key.endsWith('`'))
  ) {
    key = key.slice(1, -1).trim()
  }

  // Replace escaped newlines (e.g. \n, \\n, \\\n, \r\n, \r)
  key = key.replace(/\\+[nN]/g, '\n')
  key = key.replace(/\\+[rR]/g, '\r')
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()

  // Extract standard PEM headers and reconstruct clean 64-char lines
  const beginMatch = key.match(/-----BEGIN [A-Z ]+-----/)
  const endMatch = key.match(/-----END [A-Z ]+-----/)

  if (beginMatch && endMatch) {
    const header = beginMatch[0]
    const footer = endMatch[0]
    const headerIndex = key.indexOf(header)
    const footerIndex = key.indexOf(footer)

    if (headerIndex !== -1 && footerIndex !== -1 && footerIndex > headerIndex) {
      // Clean base64 body from any stray whitespace, slashes or quotes
      const body = key
        .slice(headerIndex + header.length, footerIndex)
        .replace(/[^A-Za-z0-9+/=]/g, '')

      const formattedBody = body.match(/.{1,64}/g)?.join('\n') || body
      return `${header}\n${formattedBody}\n${footer}\n`
    }
  }

  // If user pasted only the base64 body without headers (starts with MII...)
  const cleanedBody = key.replace(/[^A-Za-z0-9+/=]/g, '')
  if (cleanedBody.startsWith('MII') && cleanedBody.length > 500) {
    const formattedBody = cleanedBody.match(/.{1,64}/g)?.join('\n') || cleanedBody
    return `-----BEGIN PRIVATE KEY-----\n${formattedBody}\n-----END PRIVATE KEY-----\n`
  }

  return key
}

function getGoogleCredentials(): GoogleCredentials {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  const sheetId = process.env.GOOGLE_SHEET_ID
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1'
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.GOOGLE_APPS_SCRIPT_URL

  // Check if a full service account JSON key string or path was provided
  const rawKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON
  if (rawKeyJson) {
    try {
      let trimmed = rawKeyJson.trim()
      while (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.slice(1, -1).trim()
      }

      let parsed: any
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed)
      } else if (fs.existsSync(trimmed)) {
        parsed = JSON.parse(fs.readFileSync(trimmed, 'utf8'))
      } else {
        // Try base64 decoding the JSON
        try {
          const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim()
          if (decoded.startsWith('{')) {
            parsed = JSON.parse(decoded)
          }
        } catch {}
      }

      if (parsed) {
        clientEmail = clientEmail || parsed.client_email
        privateKey = privateKey || parsed.private_key
      }
    } catch (e) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON:', e)
    }
  }

  // Check if clientEmail has JSON pasted into it
  if (clientEmail && clientEmail.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(clientEmail.trim())
      if (parsed.client_email) clientEmail = parsed.client_email
      if (!privateKey && parsed.private_key) privateKey = parsed.private_key
    } catch {}
  }

  // Check if privateKey has JSON or requires normalization
  if (privateKey) {
    const trimmed = privateKey.trim()
    if (trimmed.startsWith('{') || trimmed.includes('"private_key"')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (!clientEmail && parsed.client_email) {
          clientEmail = parsed.client_email
        }
        if (parsed.private_key) {
          privateKey = parsed.private_key
        }
      } catch {}
    }
    privateKey = normalizePrivateKey(privateKey)
  }

  return {
    clientEmail,
    privateKey,
    sheetId,
    sheetRange,
    webhookUrl,
  }
}

/**
 * Generate an OAuth2 Bearer token for Google Sheets API v4 using a Service Account Private Key.
 */
async function getGoogleOAuth2AccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url')
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`

  let signature: string
  try {
    const signer = crypto.createSign('RSA-SHA256')
    signer.update(unsignedToken)
    signature = signer.sign(privateKey, 'base64url')
  } catch (err: any) {
    throw new Error(
      `Private key sign error (${err.message}). Ensure GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is a valid RSA private key.`
    )
  }
  const jwt = `${unsignedToken}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text()
    throw new Error(`Google OAuth2 error (${tokenRes.status}): ${errorText}`)
  }

  const tokenData = (await tokenRes.json()) as { access_token: string }
  return tokenData.access_token
}

/**
 * Persist order to local data/orders.json as a safe fallback & local record
 */
function saveOrderToLocalFallback(order: Order) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const ordersFile = path.join(dataDir, 'orders.json')
    let orders: Order[] = []
    if (fs.existsSync(ordersFile)) {
      try {
        orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'))
      } catch {
        orders = []
      }
    }
    orders.unshift(order)
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8')
  } catch (err) {
    console.warn('Could not save order to local fallback file:', err)
  }
}

/**
 * Check if the sheet has a header row; if empty, insert column headers.
 */
async function ensureHeadersInGoogleSheet(
  accessToken: string,
  sheetId: string,
  rangeName: string
): Promise<void> {
  try {
    const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${rangeName}!A1:M1`)}`
    const res = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (res.ok) {
      const data = (await res.json()) as { values?: string[][] }
      if (!data.values || data.values.length === 0 || !data.values[0] || data.values[0].length === 0) {
        // Sheet is empty, write header row
        const headers = [
          'Order ID',
          'Date',
          'Full Name',
          'Phone Number',
          'Wilaya',
          'Commune',
          'Delivery Type',
          'Product',
          'Unit Price',
          'Quantity',
          'Total Amount',
          'Notes',
          'Status',
        ]
        const writeHeaderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${rangeName}!A1:M1`)}?valueInputOption=USER_ENTERED`
        await fetch(writeHeaderUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `${rangeName}!A1:M1`,
            majorDimension: 'ROWS',
            values: [headers],
          }),
        })
      }
    }
  } catch (err) {
    // Non-fatal, append will still work
    console.warn('Could not verify/write headers in Google Sheet:', err)
  }
}

/**
 * Submit an order using Google Sheets REST API v4 (Service Account)
 */
async function submitViaServiceAccount(
  order: Order,
  creds: GoogleCredentials
): Promise<OrderSubmissionResult> {
  const { clientEmail, privateKey, sheetId, sheetRange = 'Sheet1' } = creds
  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error('Missing Google Service Account credentials or Sheet ID')
  }

  const accessToken = await getGoogleOAuth2AccessToken(clientEmail, privateKey)

  // Ensure header row exists for a clean spreadsheet structure
  await ensureHeadersInGoogleSheet(accessToken, sheetId, sheetRange)

  // Row columns:
  // [ Order ID, Date, Full Name, Phone Number, Wilaya, Commune, Delivery Type, Product, Unit Price, Quantity, Total Amount, Notes, Status ]
  const formattedDate = new Date(order.createdAt).toLocaleString('fr-DZ', {
    timeZone: 'Africa/Algiers',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const row = [
    order.id,
    formattedDate,
    order.fullName,
    order.phone,
    order.wilaya,
    order.commune,
    order.deliveryType === 'home delivery' ? 'Home Delivery (À Domicile)' : 'Stop Desk (Point Relais)',
    order.productTitle,
    order.productPrice || 'N/A',
    order.quantity,
    order.totalAmount,
    order.notes || '',
    order.status || 'New',
  ]

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${sheetRange}!A:M`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetRange}!A:M`,
      majorDimension: 'ROWS',
      values: [row],
    }),
  })

  if (!appendRes.ok) {
    const errBody = await appendRes.text()
    if (appendRes.status === 403) {
      throw new Error(
        `Google Sheets API Permission Denied (403): Please share your Google Sheet (ID: ${sheetId}) with the service account email: ${clientEmail} as 'Editor'.`
      )
    }
    if (appendRes.status === 404) {
      throw new Error(
        `Google Sheet Not Found (404): Please verify that GOOGLE_SHEET_ID (${sheetId}) is correct.`
      )
    }
    throw new Error(`Google Sheets API error (${appendRes.status}): ${errBody}`)
  }

  return {
    success: true,
    orderId: order.id,
    message: 'Order successfully saved to Google Sheets!',
  }
}

/**
 * Submit an order using a Google Apps Script Webhook deployment URL
 */
async function submitViaWebhook(order: Order, webhookUrl: string): Promise<OrderSubmissionResult> {
  const formattedDate = new Date(order.createdAt).toLocaleString('fr-DZ', {
    timeZone: 'Africa/Algiers',
  })

  const payload = {
    orderId: order.id,
    createdAt: formattedDate,
    fullName: order.fullName,
    phone: order.phone,
    wilaya: order.wilaya,
    commune: order.commune,
    deliveryType: order.deliveryType,
    productTitle: order.productTitle,
    productPrice: order.productPrice || '',
    quantity: order.quantity,
    totalAmount: order.totalAmount,
    notes: order.notes || '',
    status: order.status || 'New',
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Google Apps Script webhook returned status ${res.status}: ${errorText}`)
  }

  return {
    success: true,
    orderId: order.id,
    message: 'Order successfully forwarded to Google Sheet via webhook!',
  }
}

/**
 * Primary function to process and submit an order:
 * 1. Always backs up the order locally to `data/orders.json`.
 * 2. If Google Service Account or Webhook is configured, syncs to Google Sheets.
 * 3. If neither is configured, logs a helpful guidance message and completes the order in development/fallback mode.
 */
export async function submitOrderToGoogleSheets(order: Order): Promise<OrderSubmissionResult> {
  // Always save locally first so customer data is never lost
  saveOrderToLocalFallback(order)

  const creds = getGoogleCredentials()

  // 1. Google Service Account method (Official API v4)
  if (creds.clientEmail && creds.privateKey && creds.sheetId) {
    try {
      console.log(`[Google Sheets] Submitting order ${order.id} to sheet ${creds.sheetId}...`)
      const result = await submitViaServiceAccount(order, creds)
      console.log(`[Google Sheets] Order ${order.id} saved successfully to Google Sheets!`)
      return result
    } catch (err: any) {
      console.error(`[Google Sheets] Failed to submit to Google Sheets:`, err.message || err)

      // If Webhook fallback is available, attempt it
      if (creds.webhookUrl) {
        try {
          console.log(`[Google Sheets Webhook] Attempting webhook fallback for order ${order.id}...`)
          const webhookResult = await submitViaWebhook(order, creds.webhookUrl)
          console.log(`[Google Sheets Webhook] Order ${order.id} forwarded successfully via fallback!`)
          return webhookResult
        } catch (webhookErr: any) {
          console.error(`[Google Sheets Webhook] Fallback also failed:`, webhookErr.message || webhookErr)
        }
      }

      return {
        success: true,
        orderId: order.id,
        simulated: true,
        message: `Order recorded locally, but Google Sheets API sync failed: ${err.message}`,
      }
    }
  }

  // 2. Google Apps Script Webhook method
  if (creds.webhookUrl) {
    try {
      console.log(`[Google Sheets Webhook] Forwarding order ${order.id}...`)
      const result = await submitViaWebhook(order, creds.webhookUrl)
      console.log(`[Google Sheets Webhook] Order ${order.id} forwarded successfully!`)
      return result
    } catch (err: any) {
      console.error(`[Google Sheets Webhook] Failed to forward order:`, err.message || err)
      return {
        success: true,
        orderId: order.id,
        simulated: true,
        message: `Order recorded locally, but Google Sheets Webhook sync failed: ${err.message}`,
      }
    }
  }

  // 3. Fallback / Development mode (no credentials provided in .env yet)
  console.info(
    `[Google Sheets Integration] Order ${order.id} placed for ${order.fullName} (${order.productTitle}, Qty: ${order.quantity}).\n` +
      `Note: Google Sheets credentials are not configured yet in .env.\n` +
      `Configure GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY\n` +
      `or GOOGLE_SHEET_WEBHOOK_URL to sync directly with your Google Sheet.\n` +
      `The order has been safely saved in data/orders.json.`
  )

  return {
    success: true,
    orderId: order.id,
    simulated: true,
    message: 'Order placed successfully! (Recorded locally in data/orders.json)',
  }
}
