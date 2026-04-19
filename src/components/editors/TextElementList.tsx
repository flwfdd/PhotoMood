import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { nanoid } from 'nanoid'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { TextElementEditor } from './TextElementEditor'
import type { TextElement } from '../../types/template'
import { buildExifMap, renderTemplate } from '../../lib/template-parser'

function makeDefaultElement(): TextElement {
  return {
    type: 'text',
    id: nanoid(),
    content: '',
    style: {
      fontFamily: 'JetBrains Mono',
      fontSize: 0.025,
      fontWeight: 400,
      color: { type: 'fixed', value: '#2D2B2A', opacity: 1 },
      letterSpacing: 0.02,
      lineHeight: 1.4,
    },
    position: { x: 0, y: 0 },
    align: 'center',
    verticalAlign: 'middle',
  }
}

export function TextElementList() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const exifMap = buildExifMap(state.exifData)

  const elements = state.currentTemplate.elements.filter(
    (el): el is TextElement => el.type === 'text'
  )

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    const el = makeDefaultElement()
    dispatch({ type: 'ADD_ELEMENT', payload: el })
    setOpenIds((prev) => new Set(prev).add(el.id))
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_ELEMENT', payload: id })
    setOpenIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  const getPreview = (el: TextElement) => {
    const { rendered } = renderTemplate(el.content, exifMap)
    return rendered.slice(0, 30) || t('editor.emptyText')
  }

  useEffect(() => {
    const selectedId = state.selectedTextElementId
    if (!selectedId) return
    const frame = requestAnimationFrame(() => {
      setOpenIds((prev) => {
        const next = new Set(prev)
        next.add(selectedId)
        return next
      })
    })
    const node = itemRefs.current[selectedId]
    if (node) {
      requestAnimationFrame(() => {
        node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    }
    return () => cancelAnimationFrame(frame)
  }, [state.selectedTextElementId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AnimatePresence initial={false}>
        {elements.map((el) => {
          const isOpen = openIds.has(el.id)
          return (
            <motion.div
              key={el.id}
              ref={(node) => { itemRefs.current[el.id] = node }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-subtle)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div
                onClick={() => {
                  dispatch({ type: 'SELECT_TEXT_ELEMENT', payload: el.id })
                  toggleOpen(el.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span style={{
                  flex: 1,
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {getPreview(el)}
                </span>
                <button
                  onClick={(e) => handleRemove(el.id, e)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    padding: '2px',
                    borderRadius: '4px',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '0 12px 14px',
                      borderTop: '1px solid var(--bg-subtle)',
                    }}>
                      <div style={{ height: '12px' }} />
                      <TextElementEditor element={el} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <button
        onClick={handleAdd}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px',
          borderRadius: 'var(--radius-sm)',
          border: '1.5px dashed var(--bg-subtle)',
          background: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
      >
        <Plus size={16} />
        {t('editor.addText')}
      </button>
    </div>
  )
}
