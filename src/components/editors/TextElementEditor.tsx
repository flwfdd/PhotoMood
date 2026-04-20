import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import { ColorValueEditor } from './ColorValueEditor'
import { PlaceholderPicker } from './PlaceholderPicker'
import { getContrastLevel, CONTRAST_COLORS } from '../../lib/contrast-check'
import { resolveColor } from '../../lib/color-resolve'
import { buildExifMap, renderTemplate } from '../../lib/template-parser'
import { AVAILABLE_FONT_FAMILIES, AVAILABLE_FONT_WEIGHTS, ensureFontLoaded } from '../../lib/font-loader'
import type { TextElement } from '../../types/template'
import { createPortal } from 'react-dom'
import { ChevronsUpDown, X } from 'lucide-react'

const FONT_FAMILIES = AVAILABLE_FONT_FAMILIES
const FONT_WEIGHTS = AVAILABLE_FONT_WEIGHTS

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
  const isPercent = (displayValue ?? '').includes('%')
  const computedText = isPercent ? String(Math.round(value * 100)) : String(value)
  const inputMin = isPercent ? min * 100 : min
  const inputMax = isPercent ? max * 100 : max
  const inputStep = isPercent ? step * 100 : step

  const [text, setText] = useState(computedText)
  const [editing, setEditing] = useState(false)

  const commit = () => {
    const n = parseFloat(text)
    if (Number.isNaN(n)) {
      setText(computedText)
      return
    }
    const raw = isPercent ? n / 100 : n
    const clamped = Math.max(min, Math.min(max, raw))
    onChange(clamped)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            value={editing ? text : computedText}
            min={inputMin}
            max={inputMax}
            step={inputStep}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => {
              setEditing(true)
              setText(computedText)
            }}
            onBlur={() => {
              commit()
              setEditing(false)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
            style={{
              width: '72px',
              padding: '3px 6px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${editing ? 'var(--accent)' : 'var(--bg-subtle)'}`,
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right',
              outline: 'none',
              appearance: 'textfield',
              WebkitAppearance: 'none',
            }}
          />
          {isPercent && (
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>%</span>
          )}
        </div>
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
  const [fontPickerOpen, setFontPickerOpen] = useState(false)
  const fontListRef = useRef<HTMLDivElement | null>(null)
  const fontItemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
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

  useEffect(() => {
    void ensureFontLoaded({
      family: element.style.fontFamily,
      weights: [element.style.fontWeight],
      text: rendered,
    })
  }, [element.style.fontFamily, element.style.fontWeight, rendered])

  const fontPreviewText = 'Aa 123 你好'

  const FONT_GROUPS: Array<{ key: string; labelKey: string; families: readonly string[] }> = [
    {
      key: 'sans',
      labelKey: 'editor.fontGroupSans',
      families: ['Inter', 'Space Grotesk'],
    },
    {
      key: 'serif',
      labelKey: 'editor.fontGroupSerif',
      families: ['Playfair Display', 'EB Garamond'],
    },
    {
      key: 'mono',
      labelKey: 'editor.fontGroupMono',
      families: ['Space Mono', 'Special Elite'],
    },
    {
      key: 'display',
      labelKey: 'editor.fontGroupDisplay',
      families: ['Oswald', 'Abril Fatface', 'Righteous'],
    },
    {
      key: 'hand',
      labelKey: 'editor.fontGroupHand',
      families: ['Caveat', 'Dancing Script', 'Pacifico', 'Permanent Marker'],
    },
    {
      key: 'cjk',
      labelKey: 'editor.fontGroupCjk',
      families: ['Noto Sans SC', 'Noto Serif SC', 'LXGW WenKai TC', 'ZCOOL XiaoWei', 'Ma Shan Zheng'],
    },
    {
      key: 'system',
      labelKey: 'editor.fontGroupSystem',
      families: ['sans-serif', 'serif', 'monospace'],
    },
  ]

  useEffect(() => {
    if (!fontPickerOpen) return
    void Promise.all(
      FONT_FAMILIES.map((family) =>
        ensureFontLoaded({
          family,
          weights: [500],
          text: fontPreviewText + rendered,
        })
      )
    )
  }, [fontPickerOpen, rendered])

  useEffect(() => {
    if (!fontPickerOpen) return
    const target = element.style.fontFamily
    const frame = requestAnimationFrame(() => {
      const btn = fontItemRefs.current[target]
      btn?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [fontPickerOpen, element.style.fontFamily])

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
        <button
          type="button"
          onClick={() => setFontPickerOpen(true)}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span style={{ fontFamily: element.style.fontFamily, fontWeight: element.style.fontWeight }}>
            {element.style.fontFamily}
          </span>
          <ChevronsUpDown size={16} style={{ flex: 'none', color: 'var(--text-tertiary)' }} />
        </button>
        {fontPickerOpen && typeof document !== 'undefined' && createPortal(
          <>
            <div
              onClick={() => setFontPickerOpen(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 220 }}
            />
            <div
              onClick={() => setFontPickerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 221,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 'min(520px, calc(100vw - 32px))',
                  maxHeight: 'min(72dvh, 620px)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('editor.fontFamily')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFontPickerOpen(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div ref={fontListRef} style={{ overflowY: 'auto', padding: '8px 0' }}>
                  {FONT_GROUPS.map((group) => (
                    <div key={group.key}>
                      <div style={{
                        padding: '10px 16px 6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}>
                        {t(group.labelKey)}
                      </div>
                      {group.families.map((family) => {
                        const isSelected = family === element.style.fontFamily
                        return (
                          <button
                            key={family}
                            ref={(node) => { fontItemRefs.current[family] = node }}
                            type="button"
                            onClick={() => {
                              updateStyle({ fontFamily: family })
                              setFontPickerOpen(false)
                            }}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                              padding: '10px 16px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              boxSizing: 'border-box',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{
                                fontSize: '12px',
                                color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                flex: 'none',
                                minWidth: '140px',
                              }}>
                                {family}
                              </div>
                              <div style={{
                                fontSize: '16px',
                                color: 'var(--text-primary)',
                                fontFamily: `"${family}"`,
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                                flex: 1,
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {fontPreviewText}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
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
            min={-0.5 - state.currentTemplate.layout.padding.left}
            max={0.5 + state.currentTemplate.layout.padding.right}
            step={0.005}
            displayValue={`${Math.round(element.position.x * 100)}%`}
            onChange={(v) => update({ position: { ...element.position, x: v } })}
          />
          <Slider
            label={t('editor.positionY')}
            // UI convention: positive = up, negative = down.
            // Internally we keep the existing coordinate system (positive = down)
            // to avoid flipping saved templates.
            value={-element.position.y}
            min={-(0.5 + state.currentTemplate.layout.padding.bottom)}
            max={0.5 + state.currentTemplate.layout.padding.top}
            step={0.005}
            displayValue={`${Math.round((-element.position.y) * 100)}%`}
            onChange={(v) => update({ position: { ...element.position, y: -v } })}
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
