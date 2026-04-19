import { useTranslation } from 'react-i18next'
import { LayoutTemplate, Palette, Type, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { TemplateSelector } from '../editors/TemplateSelector'
import { ColorEditor } from '../editors/ColorEditor'
import { TextEditor } from '../editors/TextEditor'
import { ExifSelector } from '../editors/ExifSelector'

const PANELS = [
  { id: 'template' as const, icon: LayoutTemplate, labelKey: 'panels.template' },
  { id: 'color' as const, icon: Palette, labelKey: 'panels.color' },
  { id: 'text' as const, icon: Type, labelKey: 'panels.text' },
  { id: 'exif' as const, icon: Info, labelKey: 'panels.exif' },
]

function PanelContent({ panelId }: { panelId: string | null }) {
  switch (panelId) {
    case 'template': return <TemplateSelector />
    case 'color': return <ColorEditor />
    case 'text': return <TextEditor />
    case 'exif': return <ExifSelector />
    default: return null
  }
}

export function Sidebar() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const togglePanel = (id: typeof PANELS[number]['id']) => {
    dispatch({
      type: 'SET_ACTIVE_PANEL',
      payload: state.activePanel === id ? null : id,
    })
  }

  return (
    <aside style={{
      width: '320px',
      flexShrink: 0,
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--bg-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <nav style={{
        display: 'flex',
        borderBottom: '1px solid var(--bg-subtle)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-surface)',
        zIndex: 1,
      }}>
        {PANELS.map(({ id, icon: Icon, labelKey }) => {
          const isActive = state.activePanel === id
          return (
            <button
              key={id}
              onClick={() => togglePanel(id)}
              title={t(labelKey)}
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
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '10px', fontWeight: 500 }}>{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>

      <AnimatePresence mode="wait">
        {state.activePanel && (
          <motion.div
            key={state.activePanel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ padding: '20px', flex: 1 }}
          >
            <PanelContent panelId={state.activePanel} />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
