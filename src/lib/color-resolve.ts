import type { ExtractedColorInfo, ExtractedSwatchMap } from '../types/editor'
import type { ColorValue } from '../types/template'

interface ColorContext {
  dominantColor: string
  palette: ExtractedColorInfo[]
  swatches: ExtractedSwatchMap
}

export interface ResolvedColor {
  color: string
  opacity: number
}

export function resolveColor(colorValue: ColorValue, context: ColorContext): ResolvedColor {
  if (colorValue.type === 'fixed') {
    return { color: colorValue.value, opacity: colorValue.opacity }
  }

  if (colorValue.source === 'swatch') {
    const swatch = context.swatches[colorValue.swatchRole]
    return { color: swatch?.color.hex ?? context.dominantColor, opacity: colorValue.opacity }
  }

  const idx = colorValue.paletteIndex ?? 0
  const color = context.palette[idx]?.hex ?? context.dominantColor
  return { color, opacity: colorValue.opacity }
}

export function resolvedColorToCss(resolved: ResolvedColor): string {
  if (resolved.opacity >= 1) return resolved.color
  const hex = resolved.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${resolved.opacity})`
}
