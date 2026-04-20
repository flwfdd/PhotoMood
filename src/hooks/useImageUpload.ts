import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { isHeicFile, convertHeicToJpeg, loadImageFromFile, resizeImageIfNeeded } from '../lib/image-utils'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export interface UploadedImage {
  file: File
  originalFile: File
  image: HTMLImageElement
  objectUrl: string
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const processFile = useCallback(async (rawFile: File): Promise<UploadedImage | null> => {
    if (rawFile.size > MAX_FILE_SIZE) {
      toast.error('upload.error.tooLarge')
      return null
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
    const isValid = validTypes.includes(rawFile.type) || isHeicFile(rawFile)
    if (!isValid) {
      toast.error('upload.error.unsupported')
      return null
    }

    setIsUploading(true)
    try {
      const originalFile = rawFile
      let file = rawFile
      if (isHeicFile(rawFile)) {
        file = await convertHeicToJpeg(rawFile)
      }

      const img = await loadImageFromFile(file)
      const resized = resizeImageIfNeeded(img)

      let finalImg: HTMLImageElement
      if (resized instanceof HTMLCanvasElement) {
        const url = resized.toDataURL('image/jpeg', 0.95)
        finalImg = await new Promise((resolve, reject) => {
          const i = new Image()
          i.onload = () => resolve(i)
          i.onerror = reject
          i.src = url
        })
      } else {
        finalImg = resized
      }

      const objectUrl = URL.createObjectURL(file)
      return { file, originalFile, image: finalImg, objectUrl }
    } catch {
      toast.error('upload.error.unsupported')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { isUploading, processFile }
}
