export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function optimizeImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
): Promise<{ url: string; size: number; name: string }> {
  // If file is SVG or small GIF, return as data URL directly
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const url = await fileToDataUrl(file)
    return { url, size: file.size, name: file.name }
  }

  // If file is already smaller than 600KB, read directly
  if (file.size < 600 * 1024) {
    const url = await fileToDataUrl(file)
    return { url, size: file.size, name: file.name }
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        fileToDataUrl(file).then((url) => {
          resolve({ url, size: file.size, name: file.name })
        })
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(outputType, quality)
      const approxSize = Math.round((dataUrl.length * 3) / 4)

      resolve({
        url: dataUrl,
        size: approxSize,
        name: file.name,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      fileToDataUrl(file).then((url) => {
        resolve({ url, size: file.size, name: file.name })
      })
    }

    img.src = objectUrl
  })
}

export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export function moveItem<T>(list: T[], fromIndex: number, direction: 'prev' | 'next'): T[] {
  const toIndex = direction === 'prev' ? fromIndex - 1 : fromIndex + 1
  if (toIndex < 0 || toIndex >= list.length) return list
  return reorderArray(list, fromIndex, toIndex)
}
