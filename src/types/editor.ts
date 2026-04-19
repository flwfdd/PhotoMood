import type { ExifData } from './exif'
import type { TemplateLayout, TextStyle } from './template'

export interface EditorState {
  originalImage: HTMLImageElement | null
  croppedImage: HTMLImageElement | null
  imageSize: { width: number; height: number }

  exifData: ExifData | null
  selectedExifFields: string[]

  dominantColor: string
  palette: string[]
  isDark: boolean
  frameColor: string
  textColor: string

  currentTemplateId: string
  templateOverrides: Partial<TemplateLayout>

  textOverrides: Record<string, {
    content?: string
    style?: Partial<TextStyle>
    position?: { x: number; y: number }
  }>

  activePanel: 'template' | 'color' | 'text' | 'crop' | 'exif' | null
  canvasScale: number
}

export type EditorAction =
  | { type: 'SET_IMAGE'; payload: { original: HTMLImageElement; size: { width: number; height: number } } }
  | { type: 'SET_CROPPED_IMAGE'; payload: HTMLImageElement }
  | { type: 'SET_EXIF'; payload: ExifData | null }
  | { type: 'SET_COLOR_PALETTE'; payload: { dominant: string; palette: string[]; isDark: boolean } }
  | { type: 'SET_FRAME_COLOR'; payload: string }
  | { type: 'SET_TEXT_COLOR'; payload: string }
  | { type: 'SET_TEMPLATE'; payload: string }
  | { type: 'SET_TEMPLATE_OVERRIDES'; payload: Partial<TemplateLayout> }
  | { type: 'SET_TEXT_OVERRIDE'; payload: { id: string; override: EditorState['textOverrides'][string] } }
  | { type: 'TOGGLE_EXIF_FIELD'; payload: string }
  | { type: 'SET_ACTIVE_PANEL'; payload: EditorState['activePanel'] }
  | { type: 'SET_CANVAS_SCALE'; payload: number }
  | { type: 'RESET' }
