import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import { getTemplate } from '../../templates/registry'

export function ExifSelector() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const template = getTemplate(state.currentTemplateId)
  const fields = template?.defaultExifFields ?? []

  if (!state.exifData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {t('panels.exif')}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-tertiary)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {t('exif.noData')}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {t('panels.exif')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fields.map((f) => {
          const value = state.exifData?.[f.field]
          if (value == null) return null
          const isSelected = state.selectedExifFields.includes(f.field as string)

          return (
            <div
              key={f.field}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t(f.labelKey)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '2px',
                }}>
                  {String(value instanceof Date ? value.toLocaleDateString() : value)}
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_EXIF_FIELD', payload: f.field as string })}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 150ms',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: isSelected ? '18px' : '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  transition: 'left 150ms',
                }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
