import type { TemplateDefinition } from '../types/template'

export const minimalTemplate: TemplateDefinition = {
  id: 'builtin-minimal',
  name: { en: 'Minimal', zh: '极简' },
  builtin: true,
  version: 1,
  layout: {
    aspectRatio: { mode: 'original' },
    padding: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
    imageCornerRadius: 0.05,
    imageOpacity: 1,
    frameColor: { type: 'auto', source: 'palette', paletteIndex: 0, opacity: 1 },
    crop: null,
  },
  elements: [
    {
      type: 'text',
      id: 'minimal-camera',
      content: 'Hello World',
      style: {
        blendMode: 'overlay',
        fontFamily: 'Special Elite',
        fontSize: 0.05,
        fontWeight: 700,
        color: { type: 'fixed', value: '#FFFFFF', opacity: 1 },
        letterSpacing: 0.1,
        lineHeight: 1,
      },
      position: { x: 0, y: 0 },
      align: 'center',
      verticalAlign: 'middle',
    },
  ],
}
