import type { TemplateDefinition } from '../types/template'
import { polaroid } from './polaroid'
import { classic } from './classic'
import { half } from './half'
import { minimal } from './minimal'
import { clean } from './clean'

export const templateRegistry: TemplateDefinition[] = [
  polaroid,
  classic,
  half,
  minimal,
  clean,
]

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templateRegistry.find((t) => t.id === id)
}
