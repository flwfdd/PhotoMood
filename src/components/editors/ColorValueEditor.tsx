import { useTranslation } from 'react-i18next'
import type { ExtractedColorInfo, ExtractedSwatchMap } from '../../types/editor'
import type { AutoSwatchRole, ColorValue } from '../../types/template'
import { resolveColor } from '../../lib/color-resolve'

interface Props {
  label: string
  value: ColorValue
  onChange: (v: ColorValue) => void
  colorContext: { dominantColor: string; palette: ExtractedColorInfo[]; swatches: ExtractedSwatchMap }
  hideOpacity?: boolean
  hidePreview?: boolean
}

const PRESET_COLORS = [
  '#000000', '#1C1B1A', '#888888', '#FFFFFF', '#F4F3EE',
]

export function ColorValueEditor({ label, value, onChange, colorContext, hideOpacity, hidePreview }: Props) {
  const { t } = useTranslation()
  const isFixed = value.type === 'fixed'
  const resolved = resolveColor(value, colorContext)
  const opacity = value.opacity
  const swatchEntries = Object.entries(colorContext.swatches)
  const autoValue = value.type === 'auto' ? value : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => onChange({ type: 'auto', source: 'palette', opacity })}
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-subtle)',
            background: !isFixed ? 'var(--accent-subtle)' : 'var(--bg-surface)',
            color: !isFixed ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: !isFixed ? 600 : 400,
          }}
        >
          {t('editor.colorAuto')}
        </button>
        <button
          onClick={() => onChange({ type: 'fixed', value: resolved.color, opacity })}
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-subtle)',
            background: isFixed ? 'var(--accent-subtle)' : 'var(--bg-surface)',
            color: isFixed ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: isFixed ? 600 : 400,
          }}
        >
          {t('editor.colorFixed')}
        </button>
      </div>

      {!isFixed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {swatchEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {swatchEntries.map(([role, swatch]) => (
                  <button
                    key={role}
                    onClick={() => onChange({ type: 'auto', source: 'swatch', swatchRole: role as AutoSwatchRole, opacity })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${autoValue?.source === 'swatch' && autoValue.swatchRole === role ? 'var(--accent)' : 'var(--bg-subtle)'}`,
                      background: autoValue?.source === 'swatch' && autoValue.swatchRole === role ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '6px', backgroundColor: swatch!.color.hex, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {t(`editor.swatchRole.${role}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {colorContext.palette.map((c, i) => (
              <button
                key={i}
                onClick={() => onChange({ type: 'auto', source: 'palette', paletteIndex: i, opacity })}
                style={{
                  width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: c.hex,
                  border: `2px solid ${autoValue?.source === 'palette' && autoValue.paletteIndex === i ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                }}
                title={`${c.hex.toUpperCase()} · ${Math.round(c.proportion * 100)}%`}
              />
            ))}
          </div>
          {!hidePreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: resolved.color, border: '1px solid var(--bg-subtle)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t('editor.colorPreview')}</span>
            </div>
          )}
        </div>
      )}

      {isFixed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ type: 'fixed', value: c, opacity })}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: c,
                  border: `2px solid ${(value as Extract<ColorValue, { type: 'fixed' }>).value === c ? 'var(--accent)' : 'var(--bg-subtle)'}`,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={(value as Extract<ColorValue, { type: 'fixed' }>).value}
              onChange={(e) => onChange({ type: 'fixed', value: e.target.value, opacity })}
              style={{ width: '36px', height: '28px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--bg-subtle)', padding: '2px' }}
            />
            <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '3px 7px', borderRadius: 'var(--radius-sm)' }}>
              {(value as Extract<ColorValue, { type: 'fixed' }>).value.toUpperCase()}
            </code>
          </div>
        </div>
      )}

      {!hideOpacity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('editor.opacity')}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => onChange({ ...value, opacity: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>
      )}
    </div>
  )
}
