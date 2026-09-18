import { handleApiWeb } from './api-middleware.ts'

export default async function (event: any) {
  return await handleApiWeb(event.req)
}
