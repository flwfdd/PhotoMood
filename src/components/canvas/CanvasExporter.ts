import type Konva from 'konva'

export async function exportCanvas(stage: Konva.Stage, filename: string): Promise<void> {
  const pixelRatio = Math.min(window.devicePixelRatio * 2, 4)
  const blob = await stage.toBlob({ mimeType: 'image/jpeg', quality: 0.92, pixelRatio }) as Blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generateFilename(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '')
  const timestamp = Date.now()
  return `photomood_${base}_${timestamp}.jpg`
}
