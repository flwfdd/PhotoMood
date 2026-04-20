import exifr from 'exifr'
import type { ExifData } from '../types/exif'

export async function parseExif(file: File): Promise<ExifData | null> {
  try {
    const raw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd1: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })

    if (!raw) return null

    const altitudeValue = raw.GPSAltitude
    const altitudeRef = raw.GPSAltitudeRef
    const altitude = typeof altitudeValue === 'number'
      ? (
        altitudeRef === 1 || altitudeRef === 'Below sea level'
          ? -altitudeValue
          : altitudeValue
      )
      : undefined

    const data: ExifData = {
      make: raw.Make,
      model: raw.Model,
      lensModel: raw.LensModel,
      focalLength: raw.FocalLength,
      focalLengthIn35mmFormat: raw.FocalLengthIn35mmFormat,
      fNumber: raw.FNumber,
      exposureTime: raw.ExposureTime,
      iso: raw.ISO,
      dateTimeOriginal: raw.DateTimeOriginal instanceof Date ? raw.DateTimeOriginal : undefined,
      latitude: raw.latitude,
      longitude: raw.longitude,
      altitude,
      imageWidth: raw.ImageWidth ?? raw.ExifImageWidth,
      imageHeight: raw.ImageHeight ?? raw.ExifImageHeight,
      software: raw.Software,
      copyright: raw.Copyright,
      raw,
    }

    return data
  } catch {
    return null
  }
}

export function formatShutterSpeed(exposureTime: number): string {
  if (exposureTime >= 1) return `${exposureTime}s`
  const denominator = Math.round(1 / exposureTime)
  return `1/${denominator}s`
}

export function formatFocalLength(focalLength: number): string {
  return `${Math.round(focalLength)}mm`
}

export function formatAperture(fNumber: number): string {
  return `f/${fNumber.toFixed(1)}`
}

export function formatISO(iso: number): string {
  return `ISO${iso}`
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${hour}:${minute}:${second}`
}

export function formatTimeAmPm(date: Date): string {
  const hours = date.getHours()
  const hour12 = hours % 12 || 12
  const minute = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${String(hour12).padStart(2, '0')}:${minute} ${suffix}`
}

export function formatGpsCoordinates(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S'
  const lngDirection = longitude >= 0 ? 'E' : 'W'
  return `${Math.abs(latitude).toFixed(4)}°${latDirection}, ${Math.abs(longitude).toFixed(4)}°${lngDirection}`
}

export function formatAltitude(altitude: number): string {
  return `${Math.round(altitude)}m`
}
