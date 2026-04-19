export interface ExifData {
  make?: string
  model?: string
  lensModel?: string

  focalLength?: number
  focalLengthIn35mmFormat?: number
  fNumber?: number
  exposureTime?: number
  iso?: number

  dateTimeOriginal?: Date

  latitude?: number
  longitude?: number
  altitude?: number
  locationName?: string

  imageWidth?: number
  imageHeight?: number
  software?: string
  copyright?: string

  raw?: Record<string, unknown>
}
