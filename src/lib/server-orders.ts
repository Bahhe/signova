import { createServerFn } from '@tanstack/react-start'
import type { OrderInput, OrderSubmissionResult } from './types.ts'

export const submitOrderServerFn = createServerFn({ method: 'POST' })
  .validator((data: OrderInput) => data)
  .handler(async ({ data: input }): Promise<OrderSubmissionResult> => {
    const { processNewOrder } = await import('#/server/orders')
    return processNewOrder(input)
  })
