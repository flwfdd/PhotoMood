import type Konva from 'konva'

export type ExportResult =
  | { type: 'downloaded' }
  | { type: 'shared' }
  | { type: 'cancelled' }
  | { type: 'preview'; url: string; revoke: () => void }

export type ExportMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

export type ExportOptions = {
  mimeType: ExportMimeType
  quality?: number
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent)
}

function getPixelRatio(appleMobile: boolean) {
  return appleMobile
    ? Math.min(window.devicePixelRatio * 2, 3)
    : Math.min(window.devicePixelRatio * 2, 4)
}

function getExtension(mimeType: ExportMimeType): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function buildToBlobOptions(options: ExportOptions, pixelRatio: number) {
  const base = { mimeType: options.mimeType, pixelRatio } as const
  if (options.mimeType === 'image/jpeg' || options.mimeType === 'image/webp') {
    return { ...base, quality: options.quality ?? 0.92 }
  }
  return base
}

export async function estimateExportSize(stage: Konva.Stage, options: ExportOptions): Promise<{ bytes: number; pixelRatio: number }> {
  const appleMobile = isIOS()
  const pixelRatio = getPixelRatio(appleMobile)
  const blob = await stage.toBlob(buildToBlobOptions(options, pixelRatio)) as Blob
  return { bytes: blob.size, pixelRatio }
}

export async function exportCanvas(stage: Konva.Stage, filename: string, options: ExportOptions): Promise<ExportResult> {
  const appleMobile = isIOS()
  const pixelRatio = getPixelRatio(appleMobile)

  const blob = await stage.toBlob(buildToBlobOptions(options, pixelRatio)) as Blob

  const url = URL.createObjectURL(blob)
  const revoke = () => URL.revokeObjectURL(url)

  if (appleMobile) {
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean
      share?: (data?: ShareData) => Promise<void>
    }

    // Only mobile Safari-like environments try share first.
    if (typeof File !== 'undefined') {
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
      if (window.isSecureContext && nav.canShare?.({ files: [file] }) && nav.share) {
        try {
          await nav.share({ files: [file], title: filename })
          revoke()
          return { type: 'shared' }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            revoke()
            return { type: 'cancelled' }
          }
          // Fall back to preview below.
        }
      }
    }

    // iOS Safari over http:// (LAN IP) is unreliable for opening new windows/tabs.
    // Show an in-app preview so user can long-press save.
    return { type: 'preview', url, revoke }
  }

  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return { type: 'downloaded' }
  } finally {
    window.setTimeout(revoke, 1000)
  }
}

export function generateFilename(originalName: string, mimeType: ExportMimeType): string {
  const base = originalName.replace(/\.[^.]+$/, '')
  const timestamp = Date.now()
  return `photomood_${base}_${timestamp}.${getExtension(mimeType)}`
}
