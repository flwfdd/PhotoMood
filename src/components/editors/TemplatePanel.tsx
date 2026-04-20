import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Plus, Trash2, Link, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { builtinTemplates, getTemplateName } from '../../templates/index'
import { listUserTemplates, deleteTemplate, saveTemplate, duplicateTemplate } from '../../lib/template-storage'
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
    if (!window.confirm(t('common.confirmDeleteTemplate'))) return
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

  const handleSaveCurrent = () => {
    // If current is a user template, update it in-place.
    // If current is builtin, saving with the same id would collide; treat it as "save as".
    if (state.currentTemplate.builtin) {
      duplicateTemplate(state.currentTemplate, getTemplateName(state.currentTemplate, (navigator.language || 'en')))
    } else {
      saveTemplate(state.currentTemplate)
    }
    toast.success(t('template.saveSuccess'))
    refresh()
  }

  const sectionLabel = (label: string) => (
    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

      <div>
        {sectionLabel(t('template.userTemplates'))}
        {userTemplates.length > 0 ? (
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
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--bg-subtle)',
              background: 'color-mix(in srgb, var(--bg-subtle) 36%, transparent)',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
            }}
          >
            {t('template.userTemplatesHint')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSaveCurrent}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}
          >
            <Save size={14} />
            {t('template.save')}
          </button>
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
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
          <button
            onClick={handleShareCurrent}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}
          >
            <Link size={14} />
            {t('template.shareCurrentLink')}
          </button>
        </div>
      </div>

      <TemplateSaveDialog open={saveOpen} onClose={() => setSaveOpen(false)} onSaved={refresh} />
      <TemplateImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={refresh} />
    </div>
  )
}
