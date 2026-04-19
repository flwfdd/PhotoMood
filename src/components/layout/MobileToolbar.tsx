import { useTranslation } from 'react-i18next'
import { LayoutTemplate, Palette, Type, Info } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { TemplateSelector } from '../editors/TemplateSelector'
import { ColorEditor } from '../editors/ColorEditor'
import { TextEditor } from '../editors/TextEditor'
import { ExifSelector } from '../editors/ExifSelector'

const TOOLS = [
  { id: 'template' as const, icon: LayoutTemplate, labelKey: 'panels.template' },
  { id: 'color' as const, icon: Palette, labelKey: 'panels.color' },
  { id: 'text' as const, icon: Type, labelKey: 'panels.text' },
  { id: 'exif' as const, icon: Info, labelKey: 'panels.exif' },
]

function DrawerContent({ panelId }: { panelId: string | null }) {
  switch (panelId) {
    case 'template': return <TemplateSelector />
    case 'color': return <ColorEditor />
    case 'text': return <TextEditor />
    case 'exif': return <ExifSelector />
    default: return null
  }
}

export function MobileToolbar() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const togglePanel = (id: typeof TOOLS[number]['id']) => {
    dispatch({
      type: 'SET_ACTIVE_PANEL',
      payload: state.activePanel === id ? null : id,
    })
  }

  return (
    <>
      <AnimatePresence>
        {state.activePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: null })}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--bg-overlay)',
                zIndex: 40,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-surface)',
                borderTopLeftRadius: 'var(--radius-lg)',
                borderTopRightRadius: 'var(--radius-lg)',
                padding: '20px 16px 32px',
                zIndex: 50,
                maxHeight: '60vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-full)',
                margin: '0 auto 20px',
              }} />
              <DrawerContent panelId={state.activePanel} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--bg-subtle)',
        display: 'flex',
        boxShadow: 'var(--shadow-md)',
      }}>
        {TOOLS.map(({ id, icon: Icon, labelKey }) => {
          const isActive = state.activePanel === id
          return (
            <button
              key={id}
              onClick={() => togglePanel(id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                transition: 'color 150ms ease-out',
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '10px', fontWeight: 500 }}>{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
