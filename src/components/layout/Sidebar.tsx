import { useTranslation } from 'react-i18next'
import { LayoutTemplate, PanelLeft, Type, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { TemplatePanel } from '../editors/TemplatePanel'
import { LayoutEditor } from '../editors/LayoutEditor'
import { TextElementList } from '../editors/TextElementList'
import { ExportPanel } from '../editors/ExportPanel'
import type Konva from 'konva'

const PANELS = [
  { id: 'template' as const, icon: LayoutTemplate, labelKey: 'panels.template' },
  { id: 'layout' as const, icon: PanelLeft, labelKey: 'panels.layout' },
  { id: 'text' as const, icon: Type, labelKey: 'panels.text' },
  { id: 'export' as const, icon: Download, labelKey: 'panels.export' },
]

interface SidebarProps {
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
}

function PanelContent({ panelId, stageRef, originalFilename }: {
  panelId: string | null
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
}) {
  switch (panelId) {
    case 'template': return <TemplatePanel />
    case 'layout': return <LayoutEditor />
    case 'text': return <TextElementList />
    case 'export': return <ExportPanel stageRef={stageRef} originalFilename={originalFilename} />
    default: return null
  }
}

export function Sidebar({ stageRef, originalFilename }: SidebarProps) {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()

  const togglePanel = (id: typeof PANELS[number]['id']) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: state.activePanel === id ? null : id })
  }

  return (
    <aside style={{
      width: '320px',
      height: '100%',
      flexShrink: 0,
      backgroundColor: 'var(--bg-surface)',
      borderLeft: '1px solid var(--bg-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <nav style={{
        display: 'flex',
        borderBottom: '1px solid var(--bg-subtle)',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
      }}>
        {PANELS.map(({ id, icon: Icon, labelKey }) => {
          const isActive = state.activePanel === id
          return (
            <button
              key={id}
              onClick={() => togglePanel(id)}
              title={t(labelKey)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                transition: 'all 150ms ease-out',
              }}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span style={{ fontSize: '9px', fontWeight: 500 }}>{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {state.activePanel && (
            <motion.div
              key={state.activePanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ padding: '20px' }}
            >
              <PanelContent panelId={state.activePanel} stageRef={stageRef} originalFilename={originalFilename} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
