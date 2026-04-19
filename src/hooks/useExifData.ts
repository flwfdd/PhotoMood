import { useState, useCallback } from 'react'
import { parseExif } from '../lib/exif-parser'
import { resolveLocation } from '../lib/geo-resolver'
import type { ExifData } from '../types/exif'

export function useExifData() {
  const [exifData, setExifData] = useState<ExifData | null>(null)

  const extractExif = useCallback(async (file: File, locale: string) => {
    const data = await parseExif(file)
    if (data && data.latitude != null && data.longitude != null) {
      data.locationName = await resolveLocation(data.latitude, data.longitude, locale)
    }
    setExifData(data)
    return data
  }, [])

  return { exifData, extractExif, setExifData }
}
