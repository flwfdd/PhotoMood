import type { TemplateDefinition } from '../types/template'

export const polaroidTemplate: TemplateDefinition = {
  id: 'builtin-polaroid',
  name: { en: 'Polaroid', zh: '拍立得' },
  builtin: true,
  version: 1,
  layout: {
    aspectRatio: { mode: 'original' },
    padding: { top: 0.06, right: 0.06, bottom: 0.20, left: 0.06 },
    imageCornerRadius: 0,
    imageOpacity: 1,
    frameColor: { type: 'fixed', value: '#FFFFFF', opacity: 1 },
    crop: null,
  },
  elements: [
    {
      type: 'text',
      id: 'polaroid-camera',
      content: '{{make}}, {{model}}\n{{focalLengthIn35mmFormat}}, {{fNumber}}, {{exposureTime}}, {{iso}}',
      style: {
        fontFamily: 'Space Mono',
        fontSize: 0.025,
        fontWeight: 500,
        color: { type: 'fixed', value: '#000000', opacity: 1 },
        letterSpacing: 0,
        lineHeight: 2,
        blendMode: 'normal',
      },
      position: { x: -0.5, y: 0.5 },
      align: 'left',
      verticalAlign: 'top',
    },
    {
      type: 'text',
      id: 'polaroid-params',
      content: '{{date}} {{time}}\n{{gpsCoordinates}}, {{altitude}}',
      style: {
        fontFamily: 'Space Mono',
        fontSize: 0.025,
        fontWeight: 500,
        color: { type: 'fixed', value: '#000000', opacity: 1 },
        letterSpacing: 0,
        lineHeight: 2,
        blendMode: 'normal',
      },
      position: { x: 0.5, y: 0.5 },
      align: 'right',
      verticalAlign: 'top',
    },
  ],
}
