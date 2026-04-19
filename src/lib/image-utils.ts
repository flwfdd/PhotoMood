import type { LayoutConfig } from '../types/template'

const MAX_DIMENSION = 4096
const MAX_SAMPLE_DIMENSION = 200

export interface NormalizedCropRect {
  x: number
  y: number
  w: number
  h: number
}

export function resizeImageForSampling(img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
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

export function getVisibleCropRect(
  imageWidth: number,
  imageHeight: number,
  layout: Pick<LayoutConfig, 'crop' | 'aspectRatio'>,
  cropFocus: [number, number]
): NormalizedCropRect {
  if (layout.crop) return layout.crop

  if (layout.aspectRatio.mode === 'fixed' && layout.aspectRatio.ratio) {
    const [rw, rh] = layout.aspectRatio.ratio
    const targetRatio = rw / rh
    const srcRatio = imageWidth / imageHeight

    if (srcRatio > targetRatio) {
      const cropWidth = (imageHeight * targetRatio) / imageWidth
      return {
        x: Math.max(0, Math.min(1 - cropWidth, cropFocus[0] - cropWidth / 2)),
        y: 0,
        w: cropWidth,
        h: 1,
      }
    }

    const cropHeight = (imageWidth / targetRatio) / imageHeight
    return {
      x: 0,
      y: Math.max(0, Math.min(1 - cropHeight, cropFocus[1] - cropHeight / 2)),
      w: 1,
      h: cropHeight,
    }
  }

  return { x: 0, y: 0, w: 1, h: 1 }
}

export function createVisibleImageCanvas(
  image: HTMLImageElement,
  layout: Pick<LayoutConfig, 'crop' | 'aspectRatio'>,
  cropFocus: [number, number]
): HTMLCanvasElement {
  const crop = getVisibleCropRect(image.naturalWidth, image.naturalHeight, layout, cropFocus)
  const sourceX = crop.x * image.naturalWidth
  const sourceY = crop.y * image.naturalHeight
  const sourceW = crop.w * image.naturalWidth
  const sourceH = crop.h * image.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceW))
  canvas.height = Math.max(1, Math.round(sourceH))
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
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
