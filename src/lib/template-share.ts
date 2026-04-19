import { nanoid } from 'nanoid'
import type { TemplateDefinition } from '../types/template'

export function exportTemplate(template: TemplateDefinition): string {
  const json = JSON.stringify(template)
  return btoa(unescape(encodeURIComponent(json)))
}

function extractTemplatePayload(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('Empty template input')

  const hashMatch = trimmed.match(/[#&]template=([^&]+)/)
  if (hashMatch?.[1]) return decodeURIComponent(hashMatch[1])

  return trimmed
}

export function importTemplate(input: string): TemplateDefinition {
  const payload = extractTemplatePayload(input)
  const json = decodeURIComponent(escape(atob(payload)))
  const parsed = JSON.parse(json) as TemplateDefinition

  if (!parsed.id || !parsed.layout || !Array.isArray(parsed.elements)) {
    throw new Error('Invalid template format')
  }
  if (parsed.version !== 1) {
    throw new Error('Unsupported template version')
  }

  return {
    ...parsed,
    id: nanoid(),
    builtin: false,
  }
}

export function getTemplateFromUrlHash(): TemplateDefinition | null {
  try {
    const hash = window.location.hash
    const match = hash.match(/[#&]template=([^&]+)/)
    if (!match) return null
    return importTemplate(match[1])
  } catch {
    return null
  }
}
