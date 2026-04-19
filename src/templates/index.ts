import type { TemplateDefinition } from '../types/template'
import { polaroidTemplate } from './polaroid'
import { cleanInfoTemplate } from './clean-info'
import { minimalTemplate } from './minimal'
import { darkProTemplate } from './dark-pro'

export const builtinTemplates: TemplateDefinition[] = [
  polaroidTemplate,
  cleanInfoTemplate,
  minimalTemplate,
  darkProTemplate,
]

export function getBuiltinTemplate(id: string): TemplateDefinition | undefined {
  return builtinTemplates.find((t) => t.id === id)
}

export function getTemplateName(template: TemplateDefinition, locale: string): string {
  if (typeof template.name === 'string') return template.name
  return locale.startsWith('zh') ? template.name.zh : template.name.en
}
