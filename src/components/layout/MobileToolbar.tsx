import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutTemplate, PanelLeft, Type, Download } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { TemplatePanel } from '../editors/TemplatePanel'
import { LayoutEditor } from '../editors/LayoutEditor'
import { TextElementList } from '../editors/TextElementList'
import { ExportPanel } from '../editors/ExportPanel'
import type Konva from 'konva'

const TOOLS = [
  { id: 'template' as const, icon: LayoutTemplate, labelKey: 'panels.template' },
  { id: 'layout' as const, icon: PanelLeft, labelKey: 'panels.layout' },
  { id: 'text' as const, icon: Type, labelKey: 'panels.text' },
  { id: 'export' as const, icon: Download, labelKey: 'panels.export' },
]

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
  onHeightsChange?: (heights: { toolbar: number; drawer: number }) => void
}

function DrawerContent({ panelId, stageRef, originalFilename }: {
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

export function MobileToolbar({ stageRef, originalFilename, onHeightsChange }: Props) {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const navRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const [measuredHeights, setMeasuredHeights] = useState({ toolbar: 57, drawer: 0 })

  useEffect(() => {
    const navEl = navRef.current
    if (!navEl || !onHeightsChange) return

    const update = () => {
      const nextHeights = {
        toolbar: navEl.getBoundingClientRect().height,
        drawer: drawerRef.current?.getBoundingClientRect().height ?? 0,
      }
      setMeasuredHeights(nextHeights)
      onHeightsChange(nextHeights)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(navEl)
    if (drawerRef.current) observer.observe(drawerRef.current)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [state.activePanel, onHeightsChange])

  const togglePanel = (id: typeof TOOLS[number]['id']) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: state.activePanel === id ? null : id })
  }

  return (
    <>
      <AnimatePresence>
        {state.activePanel && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: null })}
              style={{
                position: 'fixed',
                inset: 0,
                bottom: `${measuredHeights.toolbar}px`,
                zIndex: 45,
                border: 'none',
                background: 'transparent',
                cursor: 'default',
              }}
              aria-label="Close mobile panel"
            />
            <motion.div
              ref={drawerRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: `${measuredHeights.toolbar}px`,
                backgroundColor: 'var(--bg-surface)',
                borderTopLeftRadius: 'var(--radius-lg)',
                borderTopRightRadius: 'var(--radius-lg)',
                padding: '16px 16px 20px',
                zIndex: 50,
                maxHeight: '48vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                borderTop: '1px solid var(--bg-subtle)',
              }}
            >
              <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', margin: '0 auto 16px' }} />
              <DrawerContent panelId={state.activePanel} stageRef={stageRef} originalFilename={originalFilename} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav ref={navRef} style={{ position: 'sticky', bottom: 0, zIndex: 60, backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--bg-subtle)', display: 'flex', boxShadow: 'var(--shadow-md)' }}>
        {TOOLS.map(({ id, icon: Icon, labelKey }) => {
          const isActive = state.activePanel === id
          return (
            <button
              key={id}
              onClick={() => togglePanel(id)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
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
