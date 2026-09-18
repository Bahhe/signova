import type { IncomingMessage, ServerResponse } from 'node:http'
import { uploadToSeaweedFS } from '../lib/seaweedfs.ts'
import {
  getAllProducts,
  getProductBySlug,
  saveProduct,
  deleteProduct,
} from './db-products.ts'
import type { Product } from '../lib/types.ts'

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(JSON.stringify(data))
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function getSessionFromReq(req: IncomingMessage) {
  try {
    const { auth } = await import('../lib/auth.ts')
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v))
        } else {
          headers.set(key, value)
        }
      }
    }
    return await auth.api.getSession({ headers })
  } catch (err) {
    console.error('Error reading session from request:', err)
    return null
  }
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || ''
  const method = (req.method || 'GET').toUpperCase()

  if (method === 'OPTIONS') {
    sendJson(res, 204, {})
    return true
  }

  // Auth API: /api/auth/*
  if (url.startsWith('/api/auth')) {
    try {
      const { auth } = await import('../lib/auth.ts')
      const host = req.headers.host || 'localhost:3000'
      const protocol = (req.headers['x-forwarded-proto'] as string) || 'http'
      const fullUrl = `${protocol}://${host}${url}`

      let body: any = undefined
      if (method !== 'GET' && method !== 'HEAD') {
        const rawBody = await readBody(req)
        if (rawBody) {
          body = rawBody
        }
      }

      const headers = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v))
          } else {
            headers.set(key, value)
          }
        }
      }

      const webReq = new Request(fullUrl, {
        method,
        headers,
        body,
      })

      const webRes = await auth.handler(webReq)
      res.statusCode = webRes.status

      if (typeof webRes.headers.getSetCookie === 'function') {
        const cookies = webRes.headers.getSetCookie()
        if (cookies.length > 0) {
          res.setHeader('Set-Cookie', cookies)
        }
      }

      webRes.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'set-cookie') {
          res.setHeader(key, val)
        }
      })

      const text = await webRes.text()
      res.end(text)
    } catch (err: any) {
      console.error('Error in /api/auth handler:', err)
      sendJson(res, 500, { error: err.message || 'Auth failed' })
    }
    return true
  }

  // 1. Upload to SeaweedFS: POST /api/upload
  if (url.startsWith('/api/upload') && method === 'POST') {
    const session = await getSessionFromReq(req)
    if (!session) {
      sendJson(res, 401, { error: 'Unauthorized: Please sign in to upload images' })
      return true
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      sendJson(res, 403, { error: 'Forbidden: Admin role required to upload images' })
      return true
    }

    try {
      const raw = await readBody(req)
      const data = JSON.parse(raw)
      const uploaded = await uploadToSeaweedFS(data)
      sendJson(res, 200, uploaded)
    } catch (err: any) {
      console.error('Error in /api/upload:', err)
      sendJson(res, 500, { error: err.message || 'Upload failed' })
    }
    return true
  }

  // 2. Products API: /api/products
  if (url === '/api/products' || url.startsWith('/api/products?')) {
    if (method === 'GET') {
      try {
        const products = await getAllProducts()
        sendJson(res, 200, products)
      } catch (err: any) {
        sendJson(res, 500, { error: err.message })
      }
      return true
    }

    if (method === 'POST') {
      const session = await getSessionFromReq(req)
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized: Please sign in to save products' })
        return true
      }
      const role = (session.user as { role?: string }).role || 'user'
      if (role !== 'admin') {
        sendJson(res, 403, { error: 'Forbidden: Admin role required to save products' })
        return true
      }

      try {
        const raw = await readBody(req)
        const product = JSON.parse(raw) as Product
        const saved = await saveProduct(product)
        sendJson(res, 200, saved)
      } catch (err: any) {
        console.error('Error saving product in /api/products:', err)
        sendJson(res, 500, { error: err.message })
      }
      return true
    }
  }

  // 3. Single Product: /api/products/:idOrSlug
  if (url.startsWith('/api/products/')) {
    const idOrSlug = url.replace('/api/products/', '').split('?')[0]

    if (method === 'GET') {
      try {
        const product = await getProductBySlug(idOrSlug)
        if (product) {
          sendJson(res, 200, product)
        } else {
          sendJson(res, 404, { error: 'Not found' })
        }
      } catch (err: any) {
        sendJson(res, 500, { error: err.message })
      }
      return true
    }

    if (method === 'DELETE') {
      const session = await getSessionFromReq(req)
      if (!session) {
        sendJson(res, 401, { error: 'Unauthorized: Please sign in to delete products' })
        return true
      }
      const role = (session.user as { role?: string }).role || 'user'
      if (role !== 'admin') {
        sendJson(res, 403, { error: 'Forbidden: Admin role required to delete products' })
        return true
      }

      try {
        const ok = await deleteProduct(idOrSlug)
        sendJson(res, 200, { success: ok })
      } catch (err: any) {
        sendJson(res, 500, { error: err.message })
      }
      return true
    }
  }

  // 4. Orders API: /api/orders
  if (url === '/api/orders' || url.startsWith('/api/orders?')) {
    if (method === 'POST') {
      try {
        const raw = await readBody(req)
        const orderInput = JSON.parse(raw)
        const { processNewOrder } = await import('./orders.ts')
        const result = await processNewOrder(orderInput)
        if (!result.success) {
          sendJson(res, 400, result)
        } else {
          sendJson(res, 201, result)
        }
      } catch (err: any) {
        console.error('Error in /api/orders POST:', err)
        sendJson(res, 500, { success: false, error: err.message || 'Failed to submit order' })
      }
      return true
    }

    if (method === 'GET') {
      try {
        const { default: fs } = await import('node:fs')
        const { default: path } = await import('node:path')
        const ordersFile = path.resolve(process.cwd(), 'data', 'orders.json')
        if (fs.existsSync(ordersFile)) {
          const content = fs.readFileSync(ordersFile, 'utf8')
          sendJson(res, 200, JSON.parse(content))
        } else {
          sendJson(res, 200, [])
        }
      } catch (err: any) {
        sendJson(res, 500, { error: err.message })
      }
      return true
    }
  }

  return false
}

