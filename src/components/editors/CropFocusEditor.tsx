import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'

export function CropFocusEditor() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const containerRef = useRef<HTMLDivElement>(null)

  const isFixed = state.currentTemplate.layout.aspectRatio.mode === 'fixed'
  const image = state.originalImage
  const [fx, fy] = state.cropFocus

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !(e.buttons & 1)) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    dispatch({ type: 'SET_CROP_FOCUS', payload: [x, y] })
  }, [dispatch])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    dispatch({ type: 'SET_CROP_FOCUS', payload: [x, y] })
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [dispatch])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: isFixed ? 1 : 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {t('editor.cropFocus')}
        </label>
        {!isFixed && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t('editor.cropFocusHint')}</span>
        )}
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: image ? `${(image.naturalHeight / image.naturalWidth) * 100}%` : '66.67%',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-subtle)',
          cursor: isFixed ? 'crosshair' : 'not-allowed',
          userSelect: 'none',
        }}
      >
        {image && (
          <img
            src={image.src}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            left: `${fx * 100}%`,
            top: `${fy * 100}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', width: '20px', height: '1px', backgroundColor: '#4099FF', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'absolute', width: '1px', height: '20px', backgroundColor: '#4099FF', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: '2px solid #4099FF',
              backgroundColor: 'rgba(64,153,255,0.2)',
              boxShadow: '0 0 4px rgba(0,0,0,0.4)',
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {[
          { label: t('editor.focusCenter'), x: 0.5, y: 0.5 },
          { label: t('editor.focusTop'), x: 0.5, y: 0.25 },
          { label: t('editor.focusBottom'), x: 0.5, y: 0.75 },
        ].map(({ label, x, y }) => (
          <button
            key={label}
            disabled={!isFixed}
            onClick={() => dispatch({ type: 'SET_CROP_FOCUS', payload: [x, y] })}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: isFixed ? 'pointer' : 'not-allowed',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
