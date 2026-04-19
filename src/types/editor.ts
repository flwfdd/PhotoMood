import type { ExifData } from './exif'
import type { AutoSwatchRole, TemplateDefinition } from './template'

export interface ExtractedColorInfo {
  hex: string
  textColor: string
  isDark: boolean
  oklch: {
    l: number
    c: number
    h: number
  }
  population: number
  proportion: number
}

export interface ExtractedSwatchInfo {
  role: AutoSwatchRole
  color: ExtractedColorInfo
  titleTextColor: string
  bodyTextColor: string
}

export type ExtractedSwatchMap = Partial<Record<AutoSwatchRole, ExtractedSwatchInfo>>

export interface EditorState {
  originalImage: HTMLImageElement | null
  croppedImage: HTMLImageElement | null
  imageSize: { width: number; height: number }

  exifData: ExifData | null

  dominantColor: string
  palette: ExtractedColorInfo[]
  swatches: ExtractedSwatchMap
  isDark: boolean

  currentTemplate: TemplateDefinition
  cropFocus: [number, number]
  selectedTextElementId: string | null

  activePanel: 'template' | 'layout' | 'text' | 'export' | null
  canvasScale: number
}

export type EditorAction =
  | { type: 'SET_IMAGE'; payload: { original: HTMLImageElement; size: { width: number; height: number } } }
  | { type: 'SET_EXIF'; payload: ExifData | null }
  | { type: 'SET_COLOR_PALETTE'; payload: { dominant: string; palette: ExtractedColorInfo[]; swatches: ExtractedSwatchMap; isDark: boolean } }
  | { type: 'SET_TEMPLATE'; payload: TemplateDefinition }
  | { type: 'UPDATE_TEMPLATE'; payload: Partial<TemplateDefinition> }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<TemplateDefinition['layout']> }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<import('./template').TextElement> } }
  | { type: 'ADD_ELEMENT'; payload: import('./template').TextElement }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'REORDER_ELEMENTS'; payload: import('./template').TemplateElement[] }
  | { type: 'SET_CROP_FOCUS'; payload: [number, number] }
  | { type: 'SELECT_TEXT_ELEMENT'; payload: string | null }
  | { type: 'SET_ACTIVE_PANEL'; payload: EditorState['activePanel'] }
  | { type: 'SET_CANVAS_SCALE'; payload: number }
  | { type: 'RESET' }
