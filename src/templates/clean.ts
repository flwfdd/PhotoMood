import type { TemplateDefinition } from '../types/template'

export const clean: TemplateDefinition = {
  id: 'clean',
  nameKey: 'templates.clean.name',
  descriptionKey: 'templates.clean.description',
  thumbnail: '',
  layout: {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    frameColorMode: 'fixed',
    frameColorFixed: 'transparent',
    frameCornerRadius: 0,
    textAreas: [
      {
        id: 'overlay-info',
        x: 0,
        y: 0.78,
        width: 1,
        height: 0.22,
        align: 'right',
        verticalAlign: 'bottom',
      },
    ],
  },
  defaultExifFields: [
    { field: 'model', labelKey: 'exif.camera', textAreaId: 'overlay-info' },
    { field: 'fNumber', labelKey: 'exif.aperture', format: 'f/{value}', textAreaId: 'overlay-info' },
    { field: 'focalLength', labelKey: 'exif.focalLength', format: '{value}mm', textAreaId: 'overlay-info' },
  ],
  defaultTextStyle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 13,
    fontWeight: 400,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
}
