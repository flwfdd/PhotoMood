import type { TemplateDefinition } from '../types/template'

export const polaroid: TemplateDefinition = {
  id: 'polaroid',
  nameKey: 'templates.polaroid.name',
  descriptionKey: 'templates.polaroid.description',
  thumbnail: '',
  layout: {
    padding: { top: 0.03, right: 0.03, bottom: 0.15, left: 0.03 },
    frameColorMode: 'auto',
    frameCornerRadius: 4,
    textAreas: [
      {
        id: 'camera-info',
        x: 0.03,
        y: 0.85,
        width: 0.94,
        height: 0.06,
        align: 'left',
        verticalAlign: 'middle',
      },
      {
        id: 'date-location',
        x: 0.03,
        y: 0.91,
        width: 0.94,
        height: 0.06,
        align: 'left',
        verticalAlign: 'middle',
      },
    ],
  },
  defaultExifFields: [
    { field: 'model', labelKey: 'exif.camera', textAreaId: 'camera-info' },
    { field: 'focalLength', labelKey: 'exif.focalLength', format: '{value}mm', textAreaId: 'camera-info' },
    { field: 'fNumber', labelKey: 'exif.aperture', format: 'f/{value}', textAreaId: 'camera-info' },
    { field: 'iso', labelKey: 'exif.iso', format: 'ISO {value}', textAreaId: 'camera-info' },
    { field: 'dateTimeOriginal', labelKey: 'exif.date', textAreaId: 'date-location' },
    { field: 'locationName', labelKey: 'exif.location', textAreaId: 'date-location' },
  ],
  defaultTextStyle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    fontWeight: 400,
    color: 'auto',
    letterSpacing: 0.5,
  },
}
