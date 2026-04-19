import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Plus, Trash2, Link } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { builtinTemplates, getTemplateName } from '../../templates/index'
import { listUserTemplates, deleteTemplate } from '../../lib/template-storage'
import { exportTemplate } from '../../lib/template-share'
import { TemplateSaveDialog } from './TemplateSaveDialog'
import { TemplateImportDialog } from './TemplateImportDialog'
import type { TemplateDefinition } from '../../types/template'

function TemplateCard({ template, isActive, onSelect, onDelete }: {
  template: TemplateDefinition
  isActive: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const { i18n } = useTranslation()
  const name = getTemplateName(template, i18n.language)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        position: 'relative',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--bg-subtle)'}`,
        background: isActive ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)', marginBottom: '2px' }}>
        {name}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        {template.elements.length} elements
      </div>

      {onDelete && (
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '2px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: '2px', borderRadius: '4px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export function TemplatePanel() {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const [saveOpen, setSaveOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [userTemplates, setUserTemplates] = useState(listUserTemplates)
  const [, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setUserTemplates(listUserTemplates())
    setRefreshKey((k) => k + 1)
  }, [])

  const handleSelect = (tpl: TemplateDefinition) => {
    dispatch({ type: 'SET_TEMPLATE', payload: tpl })
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    refresh()
  }

  const handleShareCurrent = () => {
    const base64 = exportTemplate(state.currentTemplate)
    const url = `${window.location.origin}${window.location.pathname}#template=${base64}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('template.shareLinkCopied'))
    })
  }

  const sectionLabel = (label: string) => (
    <h4 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {label}
    </h4>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        {sectionLabel(t('template.builtin'))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {builtinTemplates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              isActive={state.currentTemplate.id === tpl.id}
              onSelect={() => handleSelect(tpl)}
            />
          ))}
        </div>
      </div>

      {userTemplates.length > 0 && (
        <div>
          {sectionLabel(t('template.userTemplates'))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {userTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isActive={state.currentTemplate.id === tpl.id}
                onSelect={() => handleSelect(tpl)}
                onDelete={() => handleDelete(tpl.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSaveOpen(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}
          >
            <Plus size={14} />
            {t('template.saveAs')}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}
          >
            <Download size={14} />
            {t('template.import')}
          </button>
        </div>

        <button
          onClick={handleShareCurrent}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
          }}
        >
          <Link size={14} />
          {t('template.shareCurrentLink')}
        </button>
      </div>

      <TemplateSaveDialog open={saveOpen} onClose={() => setSaveOpen(false)} onSaved={refresh} />
      <TemplateImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={refresh} />
    </div>
  )
}
