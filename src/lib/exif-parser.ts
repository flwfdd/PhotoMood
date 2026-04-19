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

    const data: ExifData = {
      make: raw.Make,
      model: raw.Model,
      lensModel: raw.LensModel,
      focalLength: raw.FocalLength,
      fNumber: raw.FNumber,
      exposureTime: raw.ExposureTime,
      iso: raw.ISO,
      exposureBias: raw.ExposureCompensation,
      dateTimeOriginal: raw.DateTimeOriginal instanceof Date ? raw.DateTimeOriginal : undefined,
      latitude: raw.latitude,
      longitude: raw.longitude,
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
  if (exposureTime >= 1) return `${exposureTime}"`
  const denominator = Math.round(1 / exposureTime)
  return `1/${denominator}`
}

export function formatFocalLength(focalLength: number): string {
  return `${Math.round(focalLength)}mm`
}

export function formatAperture(fNumber: number): string {
  return `f/${fNumber}`
}

export function formatISO(iso: number): string {
  return `ISO ${iso}`
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
