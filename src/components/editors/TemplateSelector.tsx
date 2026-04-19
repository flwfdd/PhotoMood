import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { templateRegistry } from '../../templates/registry'
import { useEditor } from '../../context/EditorContext'

export function TemplateSelector() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

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
        {t('panels.template')}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {templateRegistry.map((tpl) => {
          const isActive = state.currentTemplateId === tpl.id
          return (
            <motion.button
              key={tpl.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch({ type: 'SET_TEMPLATE', payload: tpl.id })}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--bg-subtle)'}`,
                background: isActive ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms ease-out',
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                marginBottom: '2px',
              }}>
                {t(tpl.nameKey)}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
              }}>
                {t(tpl.descriptionKey)}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
