import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { duplicateTemplate } from '../../lib/template-storage'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

export function TemplateSaveDialog({ open, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { state } = useEditor()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      // "Save as" should always create a new user template id.
      // Otherwise it can collide with builtin template ids and both appear selected.
      duplicateTemplate(state.currentTemplate, trimmed)
      toast.success(t('template.saveSuccess'))
      setName('')
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '24px',
                width: 'min(320px, calc(100vw - 32px))',
                border: '1px solid var(--bg-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('template.saveAs')}
                </h3>
                <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                placeholder={t('template.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--bg-subtle)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
                    background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                    background: !name.trim() || saving ? 'var(--bg-subtle)' : 'var(--accent)',
                    color: !name.trim() || saving ? 'var(--text-tertiary)' : '#fff',
                    cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 500,
                  }}
                >
                  <Save size={14} />
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
