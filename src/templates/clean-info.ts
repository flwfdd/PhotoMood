import type { TemplateDefinition } from '../types/template'

export const cleanInfoTemplate: TemplateDefinition = {
  id: 'builtin-square-theme-top',
  name: { en: 'Square Theme Top', zh: '方形主题顶栏' },
  builtin: true,
  version: 1,
  layout: {
    aspectRatio: { mode: 'fixed', ratio: [1, 1] },
    padding: { top: 0.14, right: 0, bottom: 0, left: 0 },
    imageCornerRadius: 0,
    imageOpacity: 1,
    frameColor: { type: 'auto', source: 'palette', paletteIndex: 0, opacity: 1 },
  },
  elements: [],
}
