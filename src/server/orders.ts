import type { Order, OrderInput, OrderSubmissionResult } from '../lib/types.ts'
import { submitOrderToGoogleSheets } from './google-sheets.ts'

function calculateTotal(priceStr?: string, quantity: number = 1): string {
  if (!priceStr) return 'N/A'
  // Try extracting numeric amount from price string, e.g. "2,500 DZD" -> 2500, or "4500 DA" -> 4500
  const cleanNumeric = priceStr.replace(/[^\d.]/g, '')
  const numeric = parseFloat(cleanNumeric)
  if (!isNaN(numeric) && numeric > 0) {
    const total = numeric * quantity
    // Re-apply currency if detected
    if (/dzd/i.test(priceStr)) return `${total.toLocaleString()} DZD`
    if (/da/i.test(priceStr)) return `${total.toLocaleString()} DA`
    if (/[\$€£]/.test(priceStr)) {
      const symbol = priceStr.match(/[\$€£]/)?.[0] || ''
      return `${symbol}${total.toLocaleString()}`
    }
    return `${total.toLocaleString()}`
  }
  return priceStr
}

export async function processNewOrder(
  input: OrderInput,
): Promise<OrderSubmissionResult> {
  // Input validation
  const fullName = (input.fullName || '').trim()
  if (!fullName || fullName.length < 2) {
    return {
      success: false,
      error: 'Please enter a valid full name (at least 2 characters).',
    }
  }

  const phone = (input.phone || '').trim().replace(/[\s.-]/g, '')
  if (!phone || phone.length < 9) {
    return {
      success: false,
      error: 'Please enter a valid phone number (at least 9 digits).',
    }
  }

  const wilaya = (input.wilaya || '').trim()
  if (!wilaya) {
    return {
      success: false,
      error: 'Please select your Wilaya.',
    }
  }

  const commune = (input.commune || '').trim()
  if (!commune) {
    return {
      success: false,
      error: 'Please select your Commune.',
    }
  }

  const deliveryType = input.deliveryType
  if (deliveryType !== 'stopdesk' && deliveryType !== 'home delivery') {
    return {
      success: false,
      error: 'Please select a valid delivery type (stopdesk or home delivery).',
    }
  }

  const quantity = Math.max(1, input.quantity || 1)
  const totalAmount = calculateTotal(input.productPrice, quantity)

  // Generate unique order ID
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderId = `ORD-${timestamp}-${randomSuffix}`

  const order: Order = {
    id: orderId,
    fullName,
    phone,
    wilaya,
    commune,
    deliveryType,
    productId: input.productId,
    productTitle: input.productTitle,
    productPrice: input.productPrice,
    quantity,
    totalAmount,
    notes: (input.notes || '').trim(),
    variantId: input.variantId,
    variantTitle: input.variantTitle,
    status: 'New',
    createdAt: new Date().toISOString(),
  }

  return submitOrderToGoogleSheets(order)
}
