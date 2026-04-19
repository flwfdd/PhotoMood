import type { TemplateDefinition } from '../types/template'

export const half: TemplateDefinition = {
  id: 'half',
  nameKey: 'templates.half.name',
  descriptionKey: 'templates.half.description',
  thumbnail: '',
  layout: {
    padding: { top: 1.0, right: 0, bottom: 0, left: 0 },
    frameColorMode: 'auto',
    frameCornerRadius: 0,
    textAreas: [
      {
        id: 'date-location',
        x: 0.06,
        y: 0.15,
        width: 0.88,
        height: 0.35,
        align: 'left',
        verticalAlign: 'middle',
      },
      {
        id: 'camera-info',
        x: 0.06,
        y: 0.55,
        width: 0.88,
        height: 0.25,
        align: 'left',
        verticalAlign: 'top',
      },
    ],
  },
  defaultExifFields: [
    { field: 'dateTimeOriginal', labelKey: 'exif.date', textAreaId: 'date-location' },
    { field: 'locationName', labelKey: 'exif.location', textAreaId: 'date-location' },
    { field: 'model', labelKey: 'exif.camera', textAreaId: 'camera-info' },
    { field: 'fNumber', labelKey: 'exif.aperture', format: 'f/{value}', textAreaId: 'camera-info' },
    { field: 'focalLength', labelKey: 'exif.focalLength', format: '{value}mm', textAreaId: 'camera-info' },
  ],
  defaultTextStyle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 16,
    fontWeight: 400,
    color: 'auto',
    lineHeight: 1.8,
  },
}
