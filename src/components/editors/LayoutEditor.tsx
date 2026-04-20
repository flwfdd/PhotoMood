import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Unlock, Crop } from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import { ColorValueEditor } from './ColorValueEditor'
import { CropModal } from './CropModal'

const ASPECT_PRESETS = [
  { label: '1:1', ratio: [1, 1] as [number, number] },
  { label: '3:2', ratio: [3, 2] as [number, number] },
  { label: '4:3', ratio: [4, 3] as [number, number] },
  { label: '16:9', ratio: [16, 9] as [number, number] },
  { label: '9:16', ratio: [9, 16] as [number, number] },
]

function Slider({ label, value, min, max, step, displayValue, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  displayValue?: string; onChange: (v: number) => void
}) {
  const isPercent = (displayValue ?? '').includes('%')
  const inputMin = isPercent ? min * 100 : min
  const inputMax = isPercent ? max * 100 : max
  const inputStep = isPercent ? step * 100 : step
  const inputValue = isPercent ? value * 100 : value

  const computedText = String(isPercent ? Math.round(inputValue) : inputValue)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
          {(displayValue ?? '').includes('%') && (
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </h4>
  )
}

export function LayoutEditor() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const [paddingLocked, setPaddingLocked] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  const layout = state.currentTemplate.layout
  const colorContext = { dominantColor: state.dominantColor, palette: state.palette, swatches: state.swatches }

  const updateLayout = (updates: Partial<typeof layout>) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: updates })
  }

  const updatePadding = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    if (paddingLocked) {
      updateLayout({ padding: { top: val, right: val, bottom: val, left: val } })
    } else {
      updateLayout({ padding: { ...layout.padding, [side]: val } })
    }
  }

  const handleCustomRatio = () => {
    const w = parseFloat(customW)
    const h = parseFloat(customH)
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      updateLayout({ aspectRatio: { mode: 'fixed', ratio: [w, h] }, crop: null })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <SectionLabel>{t('editor.frameColor')}</SectionLabel>
        <ColorValueEditor
          label=""
          value={layout.frameColor}
          onChange={(v) => updateLayout({ frameColor: v })}
          colorContext={colorContext}
          hideOpacity
          hidePreview
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <SectionLabel>{t('editor.aspectRatio')}</SectionLabel>
          <button
            onClick={() => setCropOpen(true)}
            disabled={!state.originalImage}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent)', background: 'var(--accent-subtle)',
              color: 'var(--accent)', cursor: state.originalImage ? 'pointer' : 'not-allowed',
              fontWeight: 500, opacity: state.originalImage ? 1 : 0.5,
            }}
          >
            <Crop size={13} />
            {t('editor.cropButton')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button
            onClick={() => updateLayout({ aspectRatio: { mode: 'original' }, crop: null })}
            style={{
              padding: '5px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              background: layout.aspectRatio.mode === 'original' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: layout.aspectRatio.mode === 'original' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: layout.aspectRatio.mode === 'original' ? 600 : 400,
            }}
          >
            {t('editor.aspectOriginal')}
          </button>
          <button
            onClick={() => updateLayout({ aspectRatio: { mode: 'fixed', ratio: [3, 2] }, crop: null })}
            style={{
              padding: '5px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              background: layout.aspectRatio.mode === 'fixed' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: layout.aspectRatio.mode === 'fixed' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: layout.aspectRatio.mode === 'fixed' ? 600 : 400,
            }}
          >
            {t('editor.aspectFixed')}
          </button>
        </div>

        {layout.aspectRatio.mode === 'fixed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {ASPECT_PRESETS.map(({ label, ratio }) => {
                const cur = layout.aspectRatio.ratio
                const active = cur?.[0] === ratio[0] && cur?.[1] === ratio[1]
                return (
                  <button
                    key={label}
                    onClick={() => updateLayout({ aspectRatio: { mode: 'fixed', ratio }, crop: null })}
                    style={{
                      padding: '4px 8px', fontSize: '11px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--bg-subtle)',
                      background: active ? 'var(--accent)' : 'var(--bg-surface)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                placeholder="W"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                style={{
                  width: '48px', padding: '4px 6px', fontSize: '12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
                  backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
                  outline: 'none', textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>:</span>
              <input
                type="text"
                placeholder="H"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                style={{
                  width: '48px', padding: '4px 6px', fontSize: '12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
                  backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
                  outline: 'none', textAlign: 'center',
                }}
              />
              <button
                onClick={handleCustomRatio}
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--bg-subtle)', background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                {t('editor.cropApply')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <SectionLabel>{t('editor.padding')}</SectionLabel>
          <button
            onClick={() => setPaddingLocked((v) => !v)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', padding: '0' }}
            title={paddingLocked ? t('editor.paddingUnlock') : t('editor.paddingLock')}
          >
            {paddingLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <Slider
              key={side}
              label={t(`editor.padding${side.charAt(0).toUpperCase() + side.slice(1)}`)}
              value={layout.padding[side]}
              min={0} max={1} step={0.01}
              displayValue={`${Math.round(layout.padding[side] * 100)}%`}
              onChange={(v) => updatePadding(side, v)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionLabel>{t('editor.imageSettings')}</SectionLabel>
        <Slider
          label={t('editor.cornerRadius')}
          value={layout.imageCornerRadius}
          min={0} max={0.15} step={0.005}
          displayValue={`${Math.round(layout.imageCornerRadius * 100)}%`}
          onChange={(v) => updateLayout({ imageCornerRadius: v })}
        />
        <Slider
          label={t('editor.opacity')}
          value={layout.imageOpacity ?? 1}
          min={0} max={1} step={0.01}
          displayValue={`${Math.round((layout.imageOpacity ?? 1) * 100)}%`}
          onChange={(v) => updateLayout({ imageOpacity: v })}
        />
      </div>

      <CropModal open={cropOpen} onClose={() => setCropOpen(false)} />
    </div>
  )
}
