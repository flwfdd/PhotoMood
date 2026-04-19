import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { importTemplate } from '../../lib/template-share'
import { saveTemplate } from '../../lib/template-storage'
import { toast } from 'sonner'
import type { TemplateDefinition } from '../../types/template'

interface Props {
  open: boolean
  onClose: () => void
  onImported?: () => void
}

export function TemplateImportDialog({ open, onClose, onImported }: Props) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<TemplateDefinition | null>(null)
  const [error, setError] = useState('')

  const handleValidate = () => {
    try {
      const tpl = importTemplate(input)
      setPreview(tpl)
      setError('')
    } catch (e) {
      setPreview(null)
      setError(e instanceof Error ? e.message : t('template.importError'))
    }
  }

  const handleImport = () => {
    if (!preview) return
    saveTemplate(preview)
    toast.success(t('template.importSuccess'))
    setInput('')
    setPreview(null)
    onImported?.()
    onClose()
  }

  const getPreviewName = (tpl: TemplateDefinition) => {
    if (typeof tpl.name === 'string') return tpl.name
    return tpl.name.en
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
            style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
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
                width: 'min(380px, calc(100vw - 32px))',
                border: '1px solid var(--bg-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('template.import')}
                </h3>
                <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                {t('template.importHint')}
              </p>

              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setPreview(null); setError('') }}
                placeholder={t('template.importPlaceholder')}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--bg-subtle)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '8px',
                }}
              />

              {error && (
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--error)' }}>{error}</p>
              )}

              {preview && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-subtle)',
                  border: '1px solid var(--accent)',
                  marginBottom: '12px',
                }}>
                  <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)' }}>
                      {getPreviewName(preview)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {preview.elements.length} {t('template.elements')}
                    </div>
                  </div>
                </div>
              )}

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
                {!preview ? (
                  <button
                    onClick={handleValidate}
                    disabled={!input.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                      background: !input.trim() ? 'var(--bg-subtle)' : 'var(--accent)',
                      color: !input.trim() ? 'var(--text-tertiary)' : '#fff',
                      cursor: !input.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '13px', fontWeight: 500,
                    }}
                  >
                    <Upload size={14} />
                    {t('template.validate')}
                  </button>
                ) : (
                  <button
                    onClick={handleImport}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                    }}
                  >
                    <Check size={14} />
                    {t('template.confirmImport')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
