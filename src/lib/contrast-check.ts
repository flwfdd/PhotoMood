import { oklch } from 'culori'
import type { ExtractedColorInfo } from '../types/editor'

export type ContrastLevel = 'good' | 'fair' | 'poor'

function getLightnessFromColor(input: string | ExtractedColorInfo): number {
  if (typeof input !== 'string') return input.oklch.l

  try {
    const color = oklch(input)
    return color?.l ?? 0.5
  } catch {
    return 0.5
  }
}

export function getContrastLevel(fgColor: string | ExtractedColorInfo, bgColor: string | ExtractedColorInfo): ContrastLevel {
  const fgL = getLightnessFromColor(fgColor)
  const bgL = getLightnessFromColor(bgColor)
  const diff = Math.abs(fgL - bgL)

  if (diff > 0.4) return 'good'
  if (diff >= 0.25) return 'fair'
  return 'poor'
}

export const CONTRAST_COLORS: Record<ContrastLevel, string> = {
  good: '#5B8C5A',
  fair: '#C49A3C',
  poor: '#B94A48',
}
