import type { TemplateDefinition } from '../types/template'

export const colorWalkTemplate: TemplateDefinition = {
  id: 'builtin-square-theme-top',
  name: 'ColorWalk',
  builtin: true,
  version: 1,
  layout: {
    aspectRatio: { mode: 'fixed', ratio: [4, 3] },
    padding: { top: 1, right: 0, bottom: 0, left: 0 },
    imageCornerRadius: 0,
    imageOpacity: 1,
    frameColor: { type: 'auto', source: 'palette', paletteIndex: 0, opacity: 1 },
    crop: null,
  },
  elements: [
    {
      type: 'text',
      id: 'cRAvA704qHkiAfh5FY-iF',
      content: '{{locationName}}\n{{date}} {{timeAmPm}}',
      style: {
        blendMode: 'overlay',
        fontFamily: 'Noto Serif SC',
        fontSize: 0.05,
        fontWeight: 700,
        color: { type: 'fixed', value: '#FFFFFF', opacity: 1 },
        letterSpacing: 0,
        lineHeight: 1.5,
      },
      position: { x: 0, y: -1 },
      align: 'center',
      verticalAlign: 'middle',
    },
  ],
}
