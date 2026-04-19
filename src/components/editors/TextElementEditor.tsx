import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import { ColorValueEditor } from './ColorValueEditor'
import { PlaceholderPicker } from './PlaceholderPicker'
import { getContrastLevel, CONTRAST_COLORS } from '../../lib/contrast-check'
import { resolveColor } from '../../lib/color-resolve'
import { buildExifMap, renderTemplate } from '../../lib/template-parser'
import type { TextElement } from '../../types/template'

const FONT_FAMILIES = [
  'Instrument Sans',
  'Instrument Serif',
  'JetBrains Mono',
  'serif',
  'sans-serif',
  'monospace',
]

const FONT_WEIGHTS = [300, 400, 500, 600, 700] as const

function getVisibleCrop(
  imageWidth: number,
  imageHeight: number,
  layout: ReturnType<typeof useEditor>['state']['currentTemplate']['layout'],
  cropFocus: [number, number]
) {
  if (layout.crop) {
    return {
      x: layout.crop.x * imageWidth,
      y: layout.crop.y * imageHeight,
      w: layout.crop.w * imageWidth,
      h: layout.crop.h * imageHeight,
    }
  }

  if (layout.aspectRatio.mode === 'fixed' && layout.aspectRatio.ratio) {
    const [rw, rh] = layout.aspectRatio.ratio
    const targetRatio = rw / rh
    const srcRatio = imageWidth / imageHeight

    if (srcRatio > targetRatio) {
      const w = imageHeight * targetRatio
      return {
        x: Math.max(0, Math.min(imageWidth - w, cropFocus[0] * imageWidth - w / 2)),
        y: 0,
        w,
        h: imageHeight,
      }
    }

    const h = imageWidth / targetRatio
    return {
      x: 0,
      y: Math.max(0, Math.min(imageHeight - h, cropFocus[1] * imageHeight - h / 2)),
      w: imageWidth,
      h,
    }
  }

  return { x: 0, y: 0, w: imageWidth, h: imageHeight }
}

function sampleImageColor(
  image: HTMLImageElement | null,
  layout: ReturnType<typeof useEditor>['state']['currentTemplate']['layout'],
  cropFocus: [number, number],
  position: { x: number; y: number }
) {
  if (!image) return null

  try {
    const crop = getVisibleCrop(image.naturalWidth, image.naturalHeight, layout, cropFocus)
    const sourceX = crop.x + (position.x + 0.5) * crop.w
    const sourceY = crop.y + (position.y + 0.5) * crop.h
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(image, 0, 0)
    const sampleSize = Math.max(4, Math.round(Math.min(crop.w, crop.h) * 0.015))
    const sx = Math.max(0, Math.min(image.naturalWidth - sampleSize, Math.round(sourceX - sampleSize / 2)))
    const sy = Math.max(0, Math.min(image.naturalHeight - sampleSize, Math.round(sourceY - sampleSize / 2)))
    const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data
    let r = 0
    let g = 0
    let b = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0
      g += data[i + 1] ?? 0
      b += data[i + 2] ?? 0
      count += 1
    }
    if (!count) return null
    const toHex = (value: number) => Math.round(value / count).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  } catch {
    return null
  }
}

interface Props {
  element: TextElement
}

function Slider({ label, value, min, max, step, displayValue, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  displayValue?: string; onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
    </div>
  )
}

export function TextElementEditor({ element }: Props) {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const colorContext = { dominantColor: state.dominantColor, palette: state.palette, swatches: state.swatches }

  const update = (updates: Partial<TextElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: element.id, updates } })
  }

  const updateStyle = (styleUpdates: Partial<TextElement['style']>) => {
    update({ style: { ...element.style, ...styleUpdates } })
  }

  const exifMap = buildExifMap(state.exifData)
  const { rendered } = renderTemplate(element.content, exifMap)
  const resolvedTextColor = resolveColor(element.style.color, colorContext)
  const sampledBackground =
    sampleImageColor(state.originalImage, state.currentTemplate.layout, state.cropFocus, element.position) ??
    resolveColor(state.currentTemplate.layout.frameColor, colorContext).color
  const contrast = getContrastLevel(resolvedTextColor.color, sampledBackground)

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      update({ content: element.content + placeholder })
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = element.content.slice(0, start) + placeholder + element.content.slice(end)
    update({ content: newContent })
    setTimeout(() => {
      textarea.focus()
      const pos = start + placeholder.length
      textarea.setSelectionRange(pos, pos)
    }, 0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {t('editor.textContent')}
          </label>
          <PlaceholderPicker onInsert={handleInsertPlaceholder} />
        </div>
        <textarea
          ref={textareaRef}
          value={element.content}
          onChange={(e) => update({ content: e.target.value })}
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{
          marginTop: '8px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--bg-subtle)',
          backgroundColor: 'var(--bg-surface)',
          minHeight: '36px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {rendered || <span style={{ opacity: 0.4 }}>{t('editor.emptyText')}</span>}
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {t('editor.fontFamily')}
        </label>
        <select
          value={element.style.fontFamily}
          onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {t('editor.fontWeight')}
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {FONT_WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => updateStyle({ fontWeight: w })}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '11px',
                fontWeight: w,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-subtle)',
                background: element.style.fontWeight === w ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: element.style.fontWeight === w ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={t('editor.fontSize')}
        value={element.style.fontSize}
        min={0.01} max={0.12} step={0.001}
        displayValue={`${Math.round(element.style.fontSize * 100)}%`}
        onChange={(v) => updateStyle({ fontSize: v })}
      />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {t('editor.textColor')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: CONTRAST_COLORS[contrast],
            }} />
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {t(`editor.contrast.${contrast}`)}
            </span>
          </div>
        </div>
        <ColorValueEditor
          label=""
          value={element.style.color}
          onChange={(v) => updateStyle({ color: v })}
          colorContext={colorContext}
          hidePreview
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '10px' }}>
          {(['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'difference'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateStyle({ blendMode: mode })}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-subtle)',
                background: (element.style.blendMode ?? 'normal') === mode ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: (element.style.blendMode ?? 'normal') === mode ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t(`editor.blendMode.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {t('editor.textPosition')}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Slider
            label={t('editor.positionX')}
            value={element.position.x}
            min={-0.5}
            max={0.5}
            step={0.005}
            displayValue={`${Math.round(element.position.x * 100)}%`}
            onChange={(v) => update({ position: { ...element.position, x: v } })}
          />
          <Slider
            label={t('editor.positionY')}
            value={element.position.y}
            min={-0.5}
            max={0.5}
            step={0.005}
            displayValue={`${Math.round(element.position.y * 100)}%`}
            onChange={(v) => update({ position: { ...element.position, y: v } })}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {t('editor.textAlign')}
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => update({ align: a })}
              style={{
                flex: 1, padding: '5px', fontSize: '11px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-subtle)',
                background: element.align === a ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: element.align === a ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t(`editor.align.${a}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {t('editor.verticalAlign')}
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['top', 'middle', 'bottom'] as const).map((a) => (
            <button
              key={a}
              onClick={() => update({ verticalAlign: a })}
              style={{
                flex: 1, padding: '5px', fontSize: '11px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-subtle)',
                background: element.verticalAlign === a ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: element.verticalAlign === a ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t(`editor.valign.${a}`)}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={t('editor.letterSpacing')}
        value={element.style.letterSpacing}
        min={0} max={0.3} step={0.005}
        displayValue={`×${element.style.letterSpacing.toFixed(2)}`}
        onChange={(v) => updateStyle({ letterSpacing: v })}
      />

      <Slider
        label={t('editor.lineHeight')}
        value={element.style.lineHeight}
        min={1} max={3} step={0.05}
        displayValue={`×${element.style.lineHeight.toFixed(2)}`}
        onChange={(v) => updateStyle({ lineHeight: v })}
      />
    </div>
  )
}
