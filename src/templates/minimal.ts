import type { TemplateDefinition } from '../types/template'

export const minimal: TemplateDefinition = {
  id: 'minimal',
  nameKey: 'templates.minimal.name',
  descriptionKey: 'templates.minimal.description',
  thumbnail: '',
  layout: {
    padding: { top: 0, right: 0, bottom: 0.06, left: 0 },
    frameColorMode: 'auto',
    frameCornerRadius: 0,
    textAreas: [
      {
        id: 'left-info',
        x: 0.03,
        y: 0.94,
        width: 0.5,
        height: 0.05,
        align: 'left',
        verticalAlign: 'middle',
      },
      {
        id: 'right-info',
        x: 0.47,
        y: 0.94,
        width: 0.5,
        height: 0.05,
        align: 'right',
        verticalAlign: 'middle',
      },
    ],
  },
  defaultExifFields: [
    { field: 'model', labelKey: 'exif.camera', textAreaId: 'left-info' },
    { field: 'dateTimeOriginal', labelKey: 'exif.date', textAreaId: 'right-info' },
  ],
  defaultTextStyle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 11,
    fontWeight: 400,
    color: 'auto',
    letterSpacing: 0.5,
  },
}
