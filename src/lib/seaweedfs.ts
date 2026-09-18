import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createServerFn } from '@tanstack/react-start'
import type { ProductImage } from './types.ts'

const S3_ENDPOINT = process.env.SEAWEEDFS_S3_ENDPOINT || 'http://127.0.0.1:8333'
const S3_ACCESS_KEY = process.env.SEAWEEDFS_ACCESS_KEY || 'localadmin'
const S3_SECRET_KEY = process.env.SEAWEEDFS_SECRET_KEY || 'supersecret123'
const S3_BUCKET = process.env.SEAWEEDFS_BUCKET || 'signovas3'
const S3_PUBLIC_BASE = process.env.SEAWEEDFS_PUBLIC_URL || `http://localhost:8333/${S3_BUCKET}`

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

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
  // Remove data URL prefix if present (e.g. data:image/png;base64,...)
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  const mimeType = matches ? matches[1] : contentType
  const rawBase64 = matches ? matches[2] : base64Data
  const buffer = Buffer.from(rawBase64, 'base64')

  const ext = filename.includes('.') ? filename.split('.').pop() : mimeType.split('/')[1] || 'jpg'
  const cleanBaseName = filename.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanBaseName}.${ext}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: uniqueKey,
      Body: buffer,
      ContentType: mimeType,
    })
  )

  const publicUrl = `${S3_PUBLIC_BASE}/${uniqueKey}`

  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: filename,
    url: publicUrl,
    size: buffer.length,
  }
}

export async function deleteFromSeaweedFS(keyOrUrl: string): Promise<boolean> {
  try {
    const key = keyOrUrl.includes('/') ? keyOrUrl.split('/').pop()! : keyOrUrl
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
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
