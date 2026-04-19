export type AutoSwatchRole =
  | 'Vibrant'
  | 'Muted'
  | 'DarkVibrant'
  | 'DarkMuted'
  | 'LightVibrant'
  | 'LightMuted'

export type ColorValue =
  | { type: 'fixed'; value: string; opacity: number }
  | { type: 'auto'; source: 'palette'; paletteIndex?: number; opacity: number }
  | { type: 'auto'; source: 'swatch'; swatchRole: AutoSwatchRole; opacity: number }

export interface AspectRatioConfig {
  mode: 'original' | 'fixed'
  ratio?: [number, number]
}

export interface LayoutConfig {
  aspectRatio: AspectRatioConfig
  crop?: {
    x: number
    y: number
    w: number
    h: number
  } | null
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  imageCornerRadius: number
  imageOpacity: number
  frameColor: ColorValue
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 300 | 400 | 500 | 600 | 700
  color: ColorValue
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'difference'
  letterSpacing: number
  lineHeight: number
}

export interface TextElement {
  type: 'text'
  id: string
  content: string
  style: TextStyle
  position: {
    x: number
    y: number
  }
  align: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
}

export type TemplateElement = TextElement

export interface TemplateDefinition {
  id: string
  name: string | { en: string; zh: string }
  builtin: boolean
  version: 1
  layout: LayoutConfig
  elements: TemplateElement[]
}
