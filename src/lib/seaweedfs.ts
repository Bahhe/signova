import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { createServerFn } from '@tanstack/react-start'
import type { ProductImage } from './types.ts'

export interface S3Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
  isConfigured: boolean
}

export function getS3Config(): S3Config {
  // Support standard SeaweedFS, Coolify (SERVICE_URL_S3_8333, SERVICE_USER_S3), and AWS S3 environment variables
  const explicitEndpoint =
    process.env.SEAWEEDFS_S3_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    process.env.SERVICE_URL_S3_8333 ||
    process.env.SERVICE_URL_S3 ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    process.env.AWS_ENDPOINT

  const isConfigured = Boolean(explicitEndpoint)

  const endpoint = (
    explicitEndpoint ||
    (process.env.NODE_ENV === 'production'
      ? 'http://seaweedfs-master:8333'
      : 'http://127.0.0.1:8333')
  )
    .trim()
    .replace(/\/+$/, '')

  const accessKeyId = (
    process.env.SEAWEEDFS_ACCESS_KEY ||
    process.env.SERVICE_USER_S3 ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY ||
    process.env.S3_ACCESS_KEY_ID ||
    'localadmin'
  ).trim()

  const secretAccessKey = (
    process.env.SEAWEEDFS_SECRET_KEY ||
    process.env.SERVICE_PASSWORD_S3 ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    'supersecret123'
  ).trim()

  const bucket = (
    process.env.SEAWEEDFS_BUCKET ||
    process.env.S3_BUCKET ||
    process.env.AWS_BUCKET ||
    'signovas3'
  ).trim()

  const publicUrl = (
    process.env.SEAWEEDFS_PUBLIC_URL ||
    process.env.S3_PUBLIC_URL ||
    process.env.PUBLIC_S3_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '')

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    isConfigured,
  }
}

let cachedClient: S3Client | null = null
let cachedConfigKey = ''

export function getS3Client(): S3Client {
  const config = getS3Config()
  const key = `${config.endpoint}|${config.accessKeyId}|${config.secretAccessKey}`
  if (!cachedClient || cachedConfigKey !== key) {
    cachedClient = new S3Client({
      endpoint: config.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
      maxAttempts: 1, // Fail fast on unreachable endpoints instead of hanging with 3 exponential backoff retries
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5000, // 5s connection timeout (fails in 5s if host/port is unreachable)
        requestTimeout: 25000, // 25s maximum per request
      }),
    })
    cachedConfigKey = key
  }
  return cachedClient
}

// Exported for backwards compatibility
export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const client = getS3Client()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export function getPublicImageUrl(key: string): string {
  const config = getS3Config()

  if (config.publicUrl) {
    if (config.publicUrl.endsWith(`/${config.bucket}`)) {
      return `${config.publicUrl}/${key}`
    }
    return `${config.publicUrl}/${config.bucket}/${key}`
  }

  // If the endpoint is an internal Docker container name or loopback, serve via built-in proxy route
  const isInternal =
    config.endpoint.includes('seaweedfs-master') ||
    config.endpoint.includes('localhost') ||
    config.endpoint.includes('127.0.0.1') ||
    config.endpoint.includes('0.0.0.0')

  if (
    !isInternal &&
    (config.endpoint.startsWith('https://') || config.endpoint.includes('.'))
  ) {
    return `${config.endpoint}/${config.bucket}/${key}`
  }

  // Fallback to local image proxy endpoint so images load in production without requiring separate public S3 ingress
  return `/api/images/${key}`
}

let bucketEnsured = false

export async function ensureBucketExists(): Promise<void> {
  if (bucketEnsured) return
  const { bucket, endpoint } = getS3Config()
  const client = getS3Client()

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    bucketEnsured = true
  } catch (err: any) {
    const isConnErr =
      err.name === 'TimeoutError' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ENOTFOUND'

    if (isConnErr) {
      throw new Error(
        `Cannot reach S3 storage at '${endpoint}': ${err.message || err.code}`,
      )
    }

    console.log(
      `[SeaweedFS] Bucket '${bucket}' check at ${endpoint}:`,
      err.message || err,
    )
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }))
      console.log(`[SeaweedFS] Bucket '${bucket}' created successfully.`)
      bucketEnsured = true
    } catch (createErr: any) {
      if (
        createErr.name === 'BucketAlreadyExists' ||
        createErr.name === 'BucketAlreadyOwnedByYou' ||
        createErr.$metadata?.httpStatusCode === 409
      ) {
        bucketEnsured = true
      } else {
        console.warn(
          `[SeaweedFS] Could not create bucket '${bucket}':`,
          createErr.message || createErr,
        )
        // If it was another connection error, rethrow
        if (
          createErr.name === 'TimeoutError' ||
          createErr.code === 'ECONNREFUSED'
        ) {
          throw new Error(
            `Cannot reach S3 storage at '${endpoint}': ${createErr.message}`,
          )
        }
      }
    }
  }
}

export interface UploadPayload {
  base64Data: string
  filename: string
  contentType?: string
}

export async function uploadToSeaweedFS({
  base64Data,
  filename,
  contentType = 'image/jpeg',
}: UploadPayload): Promise<ProductImage> {
  const { bucket, endpoint } = getS3Config()

  // Ensure bucket is verified or created
  await ensureBucketExists()

  const client = getS3Client()

  // Remove data URL prefix if present (e.g. data:image/png;base64,...)
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  const mimeType = matches ? matches[1] : contentType
  const rawBase64 = matches ? matches[2] : base64Data
  const buffer = Buffer.from(rawBase64, 'base64')

  const ext = filename.includes('.')
    ? filename.split('.').pop()
    : mimeType.split('/')[1] || 'jpg'
  const cleanBaseName = filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanBaseName}.${ext}`

  try {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueKey,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        }),
      )
    } catch (putErr: any) {
      // If ACL: 'public-read' is not supported by this S3 server, retry without ACL
      if (
        putErr.name === 'AccessControlListNotSupported' ||
        putErr.message?.includes('ACL')
      ) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: uniqueKey,
            Body: buffer,
            ContentType: mimeType,
          }),
        )
      } else {
        throw putErr
      }
    }
  } catch (uploadErr: any) {
    throw new Error(
      `Failed to upload image to S3 at ${endpoint}: ${uploadErr.message || uploadErr.code || uploadErr}`,
    )
  }

  const publicUrl = getPublicImageUrl(uniqueKey)

  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: filename,
    url: publicUrl,
    size: buffer.length,
  }
}

export async function testS3Connection(): Promise<{
  ok: boolean
  endpoint: string
  bucket: string
  latencyMs: number
  isConfigured: boolean
  error?: string
}> {
  const t0 = Date.now()
  const config = getS3Config()
  const client = getS3Client()

  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
    return {
      ok: true,
      endpoint: config.endpoint,
      bucket: config.bucket,
      latencyMs: Date.now() - t0,
      isConfigured: config.isConfigured,
    }
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
      try {
        await client.send(new CreateBucketCommand({ Bucket: config.bucket }))
        return {
          ok: true,
          endpoint: config.endpoint,
          bucket: config.bucket,
          latencyMs: Date.now() - t0,
          isConfigured: config.isConfigured,
        }
      } catch (createErr: any) {
        return {
          ok: false,
          endpoint: config.endpoint,
          bucket: config.bucket,
          latencyMs: Date.now() - t0,
          isConfigured: config.isConfigured,
          error: `Connected to S3, but failed creating bucket '${config.bucket}': ${createErr.message || createErr}`,
        }
      }
    }

    return {
      ok: false,
      endpoint: config.endpoint,
      bucket: config.bucket,
      latencyMs: Date.now() - t0,
      isConfigured: config.isConfigured,
      error: err.message || String(err),
    }
  }
}

export async function getObjectFromSeaweedFS(key: string): Promise<{
  body: Uint8Array
  contentType?: string
  contentLength?: number
  etag?: string
} | null> {
  const { bucket } = getS3Config()
  const client = getS3Client()
  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
    if (!res.Body) return null

    const bodyBytes = await res.Body.transformToByteArray()
    return {
      body: bodyBytes,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      etag: res.ETag,
    }
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw err
  }
}

export async function deleteFromSeaweedFS(keyOrUrl: string): Promise<boolean> {
  try {
    const { bucket } = getS3Config()
    const client = getS3Client()
    const key = keyOrUrl.includes('/') ? keyOrUrl.split('/').pop()! : keyOrUrl
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
    return true
  } catch (err) {
    console.warn('Failed deleting object from SeaweedFS:', err)
    return false
  }
}

// TanStack Start Server Function to upload image from browser
export const uploadImageServerFn = createServerFn({ method: 'POST' })
  .validator((data: UploadPayload) => data)
  .handler(async ({ data }) => {
    return uploadToSeaweedFS(data)
  })
