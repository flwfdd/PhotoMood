import { useCallback } from 'react'
import { getPalette, getSwatches, type Color, type SwatchMap } from 'colorthief'
import type { LayoutConfig } from '../types/template'
import type { ExtractedColorInfo, ExtractedSwatchMap } from '../types/editor'
import { createVisibleImageCanvas, resizeImageForSampling } from '../lib/image-utils'

interface ExtractColorOptions {
  signal?: AbortSignal
  layout: Pick<LayoutConfig, 'crop' | 'aspectRatio'>
  cropFocus: [number, number]
}

function toExtractedColor(color: Color): ExtractedColorInfo {
  const oklch = color.oklch()
  return {
    hex: color.hex(),
    textColor: color.textColor,
    isDark: color.isDark,
    oklch: { l: oklch.l, c: oklch.c, h: oklch.h },
    population: color.population,
    proportion: color.proportion,
  }
}

function toExtractedSwatches(swatches: SwatchMap): ExtractedSwatchMap {
  return Object.fromEntries(
    Object.entries(swatches)
      .filter(([, swatch]) => !!swatch)
      .map(([role, swatch]) => [
        role,
        {
          role: role as keyof ExtractedSwatchMap,
          color: toExtractedColor(swatch!.color),
          titleTextColor: swatch!.titleTextColor.hex(),
          bodyTextColor: swatch!.bodyTextColor.hex(),
        },
      ])
  ) as ExtractedSwatchMap
}

export function useColorPalette() {
  const extractColors = useCallback(async (
    img: HTMLImageElement,
    options: ExtractColorOptions
  ): Promise<{ dominant: string; palette: ExtractedColorInfo[]; swatches: ExtractedSwatchMap; isDark: boolean }> => {
    const visible = createVisibleImageCanvas(img, options.layout, options.cropFocus)
    const sampled = resizeImageForSampling(visible)
    const extractionOptions = {
      colorCount: 8,
      quality: 5,
      colorSpace: 'oklch' as const,
      ignoreWhite: true,
      whiteThreshold: 245,
      alphaThreshold: 125,
      minSaturation: 0.05,
      worker: true,
      signal: options.signal,
    }

    const [paletteColors, swatches] = await Promise.all([
      getPalette(sampled, extractionOptions),
      getSwatches(sampled, {
        quality: 5,
        colorSpace: 'oklch',
        ignoreWhite: true,
        whiteThreshold: 245,
        alphaThreshold: 125,
        minSaturation: 0.05,
        worker: true,
        signal: options.signal,
      }),
    ])

    const palette = (paletteColors ?? [])
      .map(toExtractedColor)
      .filter((color, index) => index === 0 || color.proportion >= 0.01)

    const dominant = palette[0]?.hex ?? '#F4F3EE'

    return {
      dominant,
      palette: palette.length > 0 ? palette : [{
        hex: dominant,
        textColor: '#000000',
        isDark: false,
        oklch: { l: 0.95, c: 0, h: 0 },
        population: 1,
        proportion: 1,
      }],
      swatches: toExtractedSwatches(swatches),
      isDark: palette[0]?.isDark ?? false,
    }
  }, [])

  return { extractColors }
}
