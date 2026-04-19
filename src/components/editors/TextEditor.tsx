import { useTranslation } from 'react-i18next'
import { useEditor } from '../../context/EditorContext'
import { getTemplate } from '../../templates/registry'

export function TextEditor() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const template = getTemplate(state.currentTemplateId)
  const areas = template?.layout.textAreas ?? []

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
        {t('panels.text')}
      </h3>

      <div>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '6px',
          fontWeight: 500,
        }}>
          {t('editor.textColor')}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={state.textColor}
            onChange={(e) => dispatch({ type: 'SET_TEXT_COLOR', payload: e.target.value })}
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
            {state.textColor.toUpperCase()}
          </code>
        </div>
      </div>

      {areas.map((area) => (
        <div key={area.id}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            fontWeight: 500,
          }}>
            {t('editor.customText')} ({area.id})
          </label>
          <input
            type="text"
            placeholder={t('editor.customText')}
            value={state.textOverrides[area.id]?.content ?? ''}
            onChange={(e) => dispatch({
              type: 'SET_TEXT_OVERRIDE',
              payload: {
                id: area.id,
                override: { content: e.target.value || undefined },
              },
            })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
    </div>
  )
}
