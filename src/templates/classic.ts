import type { TemplateDefinition } from '../types/template'

export const classic: TemplateDefinition = {
  id: 'classic',
  nameKey: 'templates.classic.name',
  descriptionKey: 'templates.classic.description',
  thumbnail: '',
  layout: {
    padding: { top: 0.05, right: 0.05, bottom: 0.12, left: 0.05 },
    frameColorMode: 'auto',
    frameCornerRadius: 8,
    textAreas: [
      {
        id: 'camera-info',
        x: 0.05,
        y: 0.87,
        width: 0.9,
        height: 0.06,
        align: 'center',
        verticalAlign: 'middle',
      },
      {
        id: 'date-location',
        x: 0.05,
        y: 0.93,
        width: 0.9,
        height: 0.06,
        align: 'center',
        verticalAlign: 'middle',
      },
    ],
  },
  defaultExifFields: [
    { field: 'model', labelKey: 'exif.camera', textAreaId: 'camera-info' },
    { field: 'fNumber', labelKey: 'exif.aperture', format: 'f/{value}', textAreaId: 'camera-info' },
    { field: 'focalLength', labelKey: 'exif.focalLength', format: '{value}mm', textAreaId: 'camera-info' },
    { field: 'iso', labelKey: 'exif.iso', format: 'ISO {value}', textAreaId: 'camera-info' },
    { field: 'dateTimeOriginal', labelKey: 'exif.date', textAreaId: 'date-location' },
    { field: 'locationName', labelKey: 'exif.location', textAreaId: 'date-location' },
  ],
  defaultTextStyle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 13,
    fontWeight: 400,
    color: 'auto',
    letterSpacing: 0.3,
  },
}
