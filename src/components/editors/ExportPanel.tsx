import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportCanvas, generateFilename } from '../canvas/CanvasExporter'
import type Konva from 'konva'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
}

export function ExportPanel({ stageRef, originalFilename }: Props) {
  const { t } = useTranslation()

  const handleExport = async () => {
    if (!stageRef.current) return
    const toastId = toast.loading(t('export.processing'))
    try {
      const filename = generateFilename(originalFilename || 'photo')
      await exportCanvas(stageRef.current, filename)
      toast.success(t('export.success'), { id: toastId })
    } catch {
      toast.error('Export failed', { id: toastId })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {t('panels.export')}
      </h3>

      <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', lineHeight: 1.6 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          {t('export.formatHint')}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          JPEG · {t('export.qualityHint')} 92% · 4x
        </div>
      </div>

      <button
        onClick={handleExport}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none',
          backgroundColor: 'var(--accent)', color: '#ffffff',
          cursor: 'pointer', fontSize: '14px', fontWeight: 500,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Download size={16} />
        {t('export.button')}
      </button>
    </div>
  )
}
