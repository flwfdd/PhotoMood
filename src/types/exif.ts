export interface ExifData {
  make?: string
  model?: string
  lensModel?: string

  focalLength?: number
  fNumber?: number
  exposureTime?: number
  iso?: number
  exposureBias?: number

  dateTimeOriginal?: Date

  latitude?: number
  longitude?: number
  locationName?: string

  imageWidth?: number
  imageHeight?: number
  software?: string
  copyright?: string

  raw?: Record<string, unknown>
}
