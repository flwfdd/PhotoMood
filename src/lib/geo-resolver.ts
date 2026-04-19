interface ReverseGeocodeResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

const GEO_RESOLVER_ENDPOINT = 'https://api-bdc.io/data/reverse-geocode-client'
const GEO_CACHE = new Map<string, string>()

function dedupeParts(parts: Array<string | undefined>) {
  const result: string[] = []
  for (const part of parts) {
    if (!part) continue
    const normalized = part.trim()
    if (!normalized) continue
    if (!result.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      result.push(normalized)
    }
  }
  return result
}

function buildLocationLabel(data: ReverseGeocodeResponse) {
  const parts = dedupeParts([
    data.city,
    data.countryName,
  ])

  return parts.slice(0, 2).join(', ')
}

export async function resolveLocation(lat: number, lng: number, locale: string): Promise<string | undefined> {
  const language = locale.startsWith('zh') ? 'zh-hans' : 'en'
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}:${language}`
  const cached = GEO_CACHE.get(cacheKey)
  if (cached) return cached

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 6000)

  try {
    const url = new URL(GEO_RESOLVER_ENDPOINT)
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set('localityLanguage', language)

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })
    if (!response.ok) return undefined

    const data = await response.json() as ReverseGeocodeResponse

    const label = buildLocationLabel(data)
    if (!label) return undefined

    GEO_CACHE.set(cacheKey, label)
    return label
  } catch {
    return undefined
  } finally {
    window.clearTimeout(timeoutId)
  }
}
