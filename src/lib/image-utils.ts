const MAX_DIMENSION = 4096
const MAX_SAMPLE_DIMENSION = 200

export function resizeImageForSampling(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const scale = Math.min(MAX_SAMPLE_DIMENSION / img.width, MAX_SAMPLE_DIMENSION / img.height, 1)
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function resizeImageIfNeeded(img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) return img
  const canvas = document.createElement('canvas')
  const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height)
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  )
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any')
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  const resultBlob = Array.isArray(blob) ? blob[0] : blob
  return new File([resultBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}
