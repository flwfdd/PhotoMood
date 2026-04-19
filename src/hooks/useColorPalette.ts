import { useState, useCallback } from 'react'
import { getColorSync, getPaletteSync } from 'colorthief'
import { isDarkColor, getTextColorForBackground } from '../lib/color-utils'
import { resizeImageForSampling } from '../lib/image-utils'

export interface ColorPalette {
  dominant: string
  palette: string[]
  isDark: boolean
  textColor: string
}

export function useColorPalette() {
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null)

  const extractColors = useCallback(async (img: HTMLImageElement): Promise<ColorPalette> => {
    const sampled = resizeImageForSampling(img)

    const dominantColor = getColorSync(sampled, { colorCount: 5, quality: 5 })
    const paletteColors = getPaletteSync(sampled, { colorCount: 5, quality: 5 })

    const dominant = dominantColor ? dominantColor.hex() : '#F4F3EE'
    const palette = paletteColors ? paletteColors.map((c) => c.hex()) : [dominant]

    const dark = isDarkColor(dominant)
    const textColor = getTextColorForBackground(dominant)

    const result = { dominant, palette, isDark: dark, textColor }
    setColorPalette(result)
    return result
  }, [])

  return { colorPalette, extractColors }
}
