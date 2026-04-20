import type { TemplateDefinition } from '../types/template'
import { polaroidTemplate } from './polaroid'
import { colorWalkTemplate } from './color-walk'
import { minimalTemplate } from './minimal'
import { featureDemoTemplate } from './feature-demo'

export const builtinTemplates: TemplateDefinition[] = [
  polaroidTemplate,
  colorWalkTemplate,
  minimalTemplate,
  featureDemoTemplate,
]

export function getBuiltinTemplate(id: string): TemplateDefinition | undefined {
  return builtinTemplates.find((t) => t.id === id)
}

export function getTemplateName(template: TemplateDefinition, locale: string): string {
  if (typeof template.name === 'string') return template.name
  return locale.startsWith('zh') ? template.name.zh : template.name.en
}
