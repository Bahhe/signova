import type { IncomingMessage, ServerResponse } from 'node:http'
import { uploadToSeaweedFS } from '../lib/seaweedfs.ts'
import {
  getAllProducts,
  getProductBySlug,
  saveProduct,
  deleteProduct,
} from '../lib/server-products.ts'
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

  // 1. Upload to SeaweedFS: POST /api/upload
  if (url.startsWith('/api/upload') && method === 'POST') {
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
      try {
        const ok = await deleteProduct(idOrSlug)
        sendJson(res, 200, { success: ok })
      } catch (err: any) {
        sendJson(res, 500, { error: err.message })
      }
      return true
    }
  }

  return false
}
