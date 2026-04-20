const FONT_WEIGHTS = [300, 400, 500, 600, 700] as const

type FontWeight = typeof FONT_WEIGHTS[number]

const CJK_FAMILIES = new Set<string>([
  'Noto Sans SC',
  'Noto Serif SC',
  'LXGW WenKai TC',
  'ZCOOL XiaoWei',
  'Ma Shan Zheng',
])

type LinkRecord = {
  link: HTMLLinkElement
  // For CJK fonts we update the href using a growing text subset.
  textSet?: Set<string>
  href?: string
}

const linkByFamily = new Map<string, LinkRecord>()
const pendingByFamily = new Map<string, Promise<void>>()

function toGoogleFamilyParam(family: string) {
  // IMPORTANT:
  // Do NOT convert spaces to '+'. URLSearchParams will encode spaces as '+'
  // automatically; pre-converting would result in '%2B' and Google Fonts will
  // treat it as an invalid selector (400).
  return family.trim().replace(/\s+/g, ' ')
}

// Only some families support multiple weights. If we request weights that don't
// exist (e.g. ZCOOL XiaoWei only has 400), Google Fonts can respond 400.
const FAMILY_WEIGHT_SPEC: Record<string, string> = {
  // Variable/multi-weight families (real ranges from your lookup)
  Inter: 'wght@100..900',
  'Space Grotesk': 'wght@300..700',
  Oswald: 'wght@200..700',
  'Playfair Display': 'wght@400..900',
  'EB Garamond': 'wght@400..800',
  Caveat: 'wght@400..700',
  'Dancing Script': 'wght@400..700',
  'Noto Sans SC': 'wght@100..900',
  // NOTE: lower bound is 200, not 100
  'Noto Serif SC': 'wght@200..900',

  // Fixed weights
  'Space Mono': 'wght@400;700',
  // Fixed CJK weights
  'LXGW WenKai TC': 'wght@300;400;700',
}

function buildGoogleFontsHref(family: string, _weights: readonly FontWeight[], text?: string) {
  const familyParam = toGoogleFamilyParam(family)
  const url = new URL('https://fonts.googleapis.com/css2')
  const weightSpec = FAMILY_WEIGHT_SPEC[family]
  url.searchParams.set('family', weightSpec ? `${familyParam}:${weightSpec}` : familyParam)
  if (text) url.searchParams.set('text', text)
  url.searchParams.set('display', 'swap')
  return url.toString()
}

function ensureLinkForFamily(family: string) {
  const existing = linkByFamily.get(family)
  if (existing) return existing

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.referrerPolicy = 'no-referrer'
  document.head.appendChild(link)

  const record: LinkRecord = { link }
  if (CJK_FAMILIES.has(family)) record.textSet = new Set<string>()
  linkByFamily.set(family, record)
  return record
}

function getSubsetText(record: LinkRecord, extraText: string | undefined) {
  if (!record.textSet) return undefined
  if (extraText) {
    for (const ch of extraText) record.textSet.add(ch)
  }
  // Keep a stable deterministic order.
  return Array.from(record.textSet).join('')
}

async function loadViaDocumentFonts(family: string) {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!fonts?.load) return
  await fonts.load(`16px "${family}"`)
}

export async function ensureFontLoaded(options: {
  family: string
  weights?: readonly FontWeight[]
  text?: string
}): Promise<void> {
  if (typeof document === 'undefined') return

  const family = options.family
  if (family === 'serif' || family === 'sans-serif' || family === 'monospace') return
  const weights = options.weights ?? FONT_WEIGHTS

  const record = ensureLinkForFamily(family)
  const subsetText = getSubsetText(record, options.text)
  const href = buildGoogleFontsHref(family, weights, subsetText)

  // If we're already loading/up-to-date for this family+subset, reuse.
  const sameHref = record.href === href
  if (!sameHref) {
    record.href = href
    record.link.href = href
  }

  const pending = pendingByFamily.get(family)
  if (pending && sameHref) return pending

  const promise = (async () => {
    // Wait for CSS to be applied best-effort; then ensure font faces are ready.
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      record.link.addEventListener('load', done, { once: true })
      record.link.addEventListener('error', done, { once: true })
      window.setTimeout(done, 4000)
    })
    await loadViaDocumentFonts(family)
  })()

  pendingByFamily.set(family, promise)
  try {
    await promise
  } finally {
    // Allow re-load if subset text grows.
    pendingByFamily.delete(family)
  }
}

export function preloadBaseFonts(): void {
  // App UI defaults. Still "dynamic", just initiated early.
  void ensureFontLoaded({ family: 'Inter', weights: FONT_WEIGHTS })
  void ensureFontLoaded({ family: 'Instrument Serif', weights: FONT_WEIGHTS })
  void ensureFontLoaded({ family: 'Space Mono', weights: FONT_WEIGHTS })
}

export const AVAILABLE_FONT_FAMILIES = [
  // Sans
  'Inter',
  'Space Grotesk',
  // Serif
  'Playfair Display',
  'EB Garamond',
  // Mono
  'Space Mono',
  'Special Elite',
  // Display
  'Oswald',
  'Abril Fatface',
  'Righteous',
  // Handwriting
  'Caveat',
  'Dancing Script',
  'Pacifico',
  'Permanent Marker',
  // CJK
  'Noto Sans SC',
  'Noto Serif SC',
  'LXGW WenKai TC',
  'ZCOOL XiaoWei',
  'Ma Shan Zheng',
  // Generic fallbacks
  'serif',
  'sans-serif',
  'monospace',
] as const

export const AVAILABLE_FONT_WEIGHTS = FONT_WEIGHTS
