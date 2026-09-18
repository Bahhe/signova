import type { IncomingMessage, ServerResponse } from 'node:http'
import { uploadToSeaweedFS } from '../lib/seaweedfs.ts'
import {
  getAllProducts,
  getProductBySlug,
  saveProduct,
  deleteProduct,
} from './db-products.ts'
import type { Product } from '../lib/types.ts'

async function getSessionFromHeaders(headers: Headers) {
  try {
    const { auth } = await import('../lib/auth.ts')
    return await auth.api.getSession({ headers })
  } catch (err) {
    console.error('Error reading session from request:', err)
    return null
  }
}

export async function handleApiWeb(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname
  const method = request.method.toUpperCase()

  // Handle OPTIONS for CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // 1. Auth API: /api/auth/*
  if (pathname.startsWith('/api/auth')) {
    try {
      const { auth } = await import('../lib/auth.ts')
      return await auth.handler(request)
    } catch (err: any) {
      console.error('Error in /api/auth handler:', err)
      return Response.json(
        { error: err.message || 'Auth failed' },
        { status: 500 }
      )
    }
  }

  // 2. Upload to SeaweedFS: POST /api/upload
  if (pathname.startsWith('/api/upload') && method === 'POST') {
    const session = await getSessionFromHeaders(request.headers)
    if (!session) {
      return Response.json(
        { error: 'Unauthorized: Please sign in to upload images' },
        { status: 401 }
      )
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin role required to upload images' },
        { status: 403 }
      )
    }

    try {
      const data = await request.json()
      const uploaded = await uploadToSeaweedFS(data)
      return Response.json(uploaded)
    } catch (err: any) {
      console.error('Error in /api/upload:', err)
      return Response.json(
        { error: err.message || 'Upload failed' },
        { status: 500 }
      )
    }
  }

  // 3. Products API: /api/products
  if (pathname === '/api/products' || pathname === '/api/products/') {
    if (method === 'GET') {
      try {
        const products = await getAllProducts()
        return Response.json(products)
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 })
      }
    }

    if (method === 'POST') {
      const session = await getSessionFromHeaders(request.headers)
      if (!session) {
        return Response.json(
          { error: 'Unauthorized: Please sign in to save products' },
          { status: 401 }
        )
      }
      const role = (session.user as { role?: string }).role || 'user'
      if (role !== 'admin') {
        return Response.json(
          { error: 'Forbidden: Admin role required to save products' },
          { status: 403 }
        )
      }

      try {
        const product = (await request.json()) as Product
        const saved = await saveProduct(product)
        return Response.json(saved)
      } catch (err: any) {
        console.error('Error saving product in /api/products:', err)
        return Response.json({ error: err.message }, { status: 500 })
      }
    }
  }

  // 4. Single Product: /api/products/:idOrSlug
  if (pathname.startsWith('/api/products/')) {
    const idOrSlug = pathname.replace('/api/products/', '').split('?')[0]

    if (idOrSlug) {
      if (method === 'GET') {
        try {
          const product = await getProductBySlug(idOrSlug)
          if (product) {
            return Response.json(product)
          }
          return Response.json({ error: 'Not found' }, { status: 404 })
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 500 })
        }
      }

      if (method === 'DELETE') {
        const session = await getSessionFromHeaders(request.headers)
        if (!session) {
          return Response.json(
            { error: 'Unauthorized: Please sign in to delete products' },
            { status: 401 }
          )
        }
        const role = (session.user as { role?: string }).role || 'user'
        if (role !== 'admin') {
          return Response.json(
            { error: 'Forbidden: Admin role required to delete products' },
            { status: 403 }
          )
        }

        try {
          const ok = await deleteProduct(idOrSlug)
          return Response.json({ success: ok })
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 500 })
        }
      }
    }
  }

  // 5. Orders API: /api/orders
  if (pathname === '/api/orders' || pathname === '/api/orders/') {
    if (method === 'POST') {
      try {
        const orderInput = await request.json()
        const { processNewOrder } = await import('./orders.ts')
        const result = await processNewOrder(orderInput)
        if (!result.success) {
          return Response.json(result, { status: 400 })
        }
        return Response.json(result, { status: 201 })
      } catch (err: any) {
        console.error('Error in /api/orders POST:', err)
        return Response.json(
          { success: false, error: err.message || 'Failed to submit order' },
          { status: 500 }
        )
      }
    }

    if (method === 'GET') {
      try {
        const { default: fs } = await import('node:fs')
        const { default: path } = await import('node:path')
        const ordersFile = path.resolve(process.cwd(), 'data', 'orders.json')
        if (fs.existsSync(ordersFile)) {
          const content = fs.readFileSync(ordersFile, 'utf8')
          return Response.json(JSON.parse(content))
        }
        return Response.json([])
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 })
      }
    }
  }

  return Response.json({ error: 'Endpoint not found' }, { status: 404 })
}

// Helper for Connect / Vite dev server middleware
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || ''
  if (!url.startsWith('/api/')) {
    return false
  }

  const host = req.headers.host || 'localhost:3000'
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http'
  const fullUrl = `${protocol}://${host}${url}`
  const method = (req.method || 'GET').toUpperCase()

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

  let body: BodyInit | undefined = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      req.on('end', () => resolve())
      req.on('error', reject)
    })
    if (chunks.length > 0) {
      body = Buffer.concat(chunks)
    }
  }

  const webReq = new Request(fullUrl, {
    method,
    headers,
    body,
    // @ts-ignore - duplex is needed for RequestInit with body in Node
    duplex: 'half',
  })

  const webRes = await handleApiWeb(webReq)

  res.statusCode = webRes.status

  if (typeof (webRes.headers as any).getSetCookie === 'function') {
    const cookies = (webRes.headers as any).getSetCookie()
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies)
    }
  }

  webRes.headers.forEach((val, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, val)
    }
  })

  if (webRes.body) {
    const arrayBuffer = await webRes.arrayBuffer()
    res.end(Buffer.from(arrayBuffer))
  } else {
    res.end()
  }

  return true
}
