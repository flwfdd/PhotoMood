import type { ExifData } from '../types/exif'
import { formatShutterSpeed, formatFocalLength, formatAperture, formatISO, formatDate, formatTime, formatGpsCoordinates, formatAltitude } from './exif-parser'

const PLACEHOLDER_REGEX = /\{\{exif\.(\w+)\}\}/g

export function buildExifMap(exifData: ExifData | null): Record<string, string> {
  if (!exifData) return {}

  const map: Record<string, string> = {}

  if (exifData.make) map.make = exifData.make
  if (exifData.model) map.model = exifData.model
  if (exifData.lensModel) map.lensModel = exifData.lensModel
  if (exifData.focalLength != null) map.focalLength = formatFocalLength(exifData.focalLength)
  if (exifData.focalLengthIn35mmFormat != null) map.focalLengthIn35mmFormat = formatFocalLength(exifData.focalLengthIn35mmFormat)
  if (exifData.fNumber != null) map.fNumber = formatAperture(exifData.fNumber)
  if (exifData.iso != null) map.iso = formatISO(exifData.iso)
  if (exifData.exposureTime != null) map.exposureTime = formatShutterSpeed(exifData.exposureTime)
  if (exifData.locationName) map.locationName = exifData.locationName
  if (exifData.latitude != null && exifData.longitude != null) {
    map.gpsCoordinates = formatGpsCoordinates(exifData.latitude, exifData.longitude)
  }
  if (exifData.altitude != null) map.altitude = formatAltitude(exifData.altitude)
  if (exifData.imageWidth != null) map.imageWidth = String(exifData.imageWidth)
  if (exifData.imageHeight != null) map.imageHeight = String(exifData.imageHeight)
  if (exifData.software) map.software = exifData.software

  if (exifData.dateTimeOriginal instanceof Date) {
    const date = exifData.dateTimeOriginal
    map.date = formatDate(date)
    map.time = formatTime(date)
  }

  return map
}

export interface RenderResult {
  rendered: string
  unresolvedFields: string[]
}

export function renderTemplate(content: string, exifMap: Record<string, string>): RenderResult {
  const unresolvedFields: string[] = []
  const rendered = content.replace(PLACEHOLDER_REGEX, (_match, fieldName) => {
    if (exifMap[fieldName] != null) {
      return exifMap[fieldName]
    }
    unresolvedFields.push(fieldName)
    return `{{exif.${fieldName}}}`
  })
  return { rendered, unresolvedFields }
}

export const EXIF_FIELD_GROUPS = [
  {
    groupKey: 'exif.groups.camera',
    fields: ['make', 'model', 'lensModel'],
  },
  {
    groupKey: 'exif.groups.params',
    fields: ['focalLength', 'focalLengthIn35mmFormat', 'fNumber', 'exposureTime', 'iso'],
  },
  {
    groupKey: 'exif.groups.datetime',
    fields: ['date', 'time'],
  },
  {
    groupKey: 'exif.groups.location',
    fields: ['locationName', 'gpsCoordinates', 'altitude'],
  },
  {
    groupKey: 'exif.groups.other',
    fields: ['imageWidth', 'imageHeight', 'software'],
  },
]
