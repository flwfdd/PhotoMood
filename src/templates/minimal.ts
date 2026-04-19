import type { TemplateDefinition } from '../types/template'

export const minimalTemplate: TemplateDefinition = {
  id: 'builtin-minimal',
  name: { en: 'Minimal', zh: '极简' },
  builtin: true,
  version: 1,
  layout: {
    aspectRatio: { mode: 'original' },
    padding: { top: 0, right: 0, bottom: 0.06, left: 0 },
    imageCornerRadius: 0,
    imageOpacity: 1,
    frameColor: { type: 'fixed', value: '#1C1B1A', opacity: 1 },
  },
  elements: [
    {
      type: 'text',
      id: 'minimal-camera',
      content: '{{exif.model}}',
      style: {
        fontFamily: 'JetBrains Mono',
        fontSize: 0.018,
        fontWeight: 400,
        color: { type: 'fixed', value: '#F4F3EE', opacity: 0.7 },
        letterSpacing: 0.08,
        lineHeight: 1.4,
      },
      position: { x: -0.35, y: 0.47 },
      align: 'left',
      verticalAlign: 'middle',
    },
    {
      type: 'text',
      id: 'minimal-date',
      content: '{{exif.date}}',
      style: {
        fontFamily: 'JetBrains Mono',
        fontSize: 0.018,
        fontWeight: 400,
        color: { type: 'fixed', value: '#F4F3EE', opacity: 0.7 },
        letterSpacing: 0.08,
        lineHeight: 1.4,
      },
      position: { x: 0.35, y: 0.47 },
      align: 'right',
      verticalAlign: 'middle',
    },
  ],
}
