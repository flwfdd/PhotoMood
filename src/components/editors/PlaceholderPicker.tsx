import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Hash, X } from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import { buildExifMap, EXIF_FIELD_GROUPS } from '../../lib/template-parser'

interface Props {
  onInsert: (placeholder: string) => void
}

export function PlaceholderPicker({ onInsert }: Props) {
  const { t } = useTranslation()
  const { state } = useEditor()
  const [open, setOpen] = useState(false)

  const exifMap = buildExifMap(state.exifData)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t('editor.insertExif')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--bg-subtle)',
          background: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        <Hash size={14} />
        {t('editor.insertExif')}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 210 }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 211, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{
              width: 'min(420px, calc(100vw - 32px))',
              maxHeight: 'min(70vh, 560px)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--bg-subtle)' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('editor.insertExif')}
                </div>
                <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '8px 0' }}>
                {EXIF_FIELD_GROUPS.map((group) => (
                  <div key={group.groupKey}>
                    <div style={{
                      padding: '6px 16px 3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      {t(group.groupKey)}
                    </div>
                    {group.fields.map((field) => {
                      const val = exifMap[field]
                      const hasValue = val != null && val !== ''
                      return (
                        <button
                          key={field}
                          onClick={() => {
                            onInsert(`{{exif.${field}}}`)
                            setOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 16px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            opacity: hasValue ? 1 : 0.45,
                            boxSizing: 'border-box',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', paddingLeft: '2px' }}>
                            {field}
                          </code>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px', paddingRight: '2px' }}>
                            {hasValue ? val : t('exif.noValue')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
