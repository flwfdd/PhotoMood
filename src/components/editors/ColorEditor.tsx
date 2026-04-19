import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import { getTextColorForBackground } from '../../lib/color-utils'

export function ColorEditor() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const handleFrameColorChange = (color: string) => {
    dispatch({ type: 'SET_FRAME_COLOR', payload: color })
    dispatch({ type: 'SET_TEXT_COLOR', payload: getTextColorForBackground(color) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {t('panels.color')}
      </h3>

      <div>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          fontWeight: 500,
        }}>
          {t('editor.palette')}
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {state.palette.map((color, i) => (
            <button
              key={i}
              onClick={() => handleFrameColorChange(color)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: color,
                border: `2px solid ${state.frameColor === color ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                outline: 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          fontWeight: 500,
        }}>
          {t('editor.frameColor')}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={state.frameColor}
            onChange={(e) => handleFrameColorChange(e.target.value)}
            style={{
              width: '40px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              cursor: 'pointer',
              padding: '2px',
            }}
          />
          <code style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}>
            {state.frameColor.toUpperCase()}
          </code>
        </div>
      </div>
    </div>
  )
}
