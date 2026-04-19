import { nanoid } from 'nanoid'
import type { TemplateDefinition } from '../types/template'

const STORAGE_KEY = 'photo-mood-user-templates'

export function listUserTemplates(): TemplateDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TemplateDefinition[]
  } catch {
    return []
  }
}

export function saveTemplate(template: TemplateDefinition): TemplateDefinition {
  const saved: TemplateDefinition = {
    ...template,
    id: template.id || nanoid(),
    builtin: false,
  }
  const list = listUserTemplates().filter((t) => t.id !== saved.id)
  list.push(saved)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return saved
}

export function deleteTemplate(id: string): void {
  const list = listUserTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function duplicateTemplate(template: TemplateDefinition, newName: string): TemplateDefinition {
  return saveTemplate({
    ...template,
    id: nanoid(),
    name: newName,
    builtin: false,
  })
}
