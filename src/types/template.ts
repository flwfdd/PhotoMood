import type { ExifData } from './exif'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: 'auto' | string
  letterSpacing?: number
  lineHeight?: number
}

export interface TextAreaDefinition {
  id: string
  x: number
  y: number
  width: number
  height: number
  align: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
}

export interface ExifFieldConfig {
  field: keyof ExifData
  labelKey: string
  format?: string
  textAreaId: string
}

export interface TemplateLayout {
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  frameColorMode: 'auto' | 'fixed'
  frameColorFixed?: string
  frameCornerRadius?: number
  textAreas: TextAreaDefinition[]
}

export interface TemplateDefinition {
  id: string
  nameKey: string
  descriptionKey: string
  thumbnail: string
  layout: TemplateLayout
  defaultExifFields: ExifFieldConfig[]
  defaultTextStyle: TextStyle
}
