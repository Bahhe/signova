import type { Order, OrderInput, OrderSubmissionResult } from '../lib/types.ts'
import { submitOrderToGoogleSheets } from './google-sheets.ts'

function calculateTotal(
  priceStr?: string,
  quantity: number = 1,
  deliveryFee: number = 0,
): string {
  if (!priceStr) return 'N/A'
  const cleanNumeric = priceStr.replace(/[^\d.]/g, '')
  const numeric = parseFloat(cleanNumeric)
  if (!isNaN(numeric) && numeric > 0) {
    const total = numeric * quantity + (deliveryFee || 0)
    return `${total.toLocaleString('fr-FR')} دج`
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
  const isFreeDelivery = Boolean(input.isFreeDelivery)
  const deliveryFee =
    typeof input.deliveryFee === 'number'
      ? Math.max(0, input.deliveryFee)
      : 0
  const effectiveDeliveryFee = isFreeDelivery ? 0 : deliveryFee
  const totalAmount = calculateTotal(
    input.productPrice,
    quantity,
    effectiveDeliveryFee,
  )

  const homeDeliveryPrice =
    input.homeDeliveryPrice ||
    (isFreeDelivery
      ? 'مجاني (0 دج)'
      : deliveryType === 'home delivery'
        ? `${effectiveDeliveryFee} دج`
        : '-')

  const stopdeskPrice =
    input.stopdeskPrice ||
    (isFreeDelivery
      ? 'مجاني (0 دج)'
      : deliveryType === 'stopdesk'
        ? `${effectiveDeliveryFee} دج`
        : '-')

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
    deliveryFee: effectiveDeliveryFee,
    homeDeliveryPrice,
    stopdeskPrice,
    isFreeDelivery,
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
