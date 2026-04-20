import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { estimateExportSize, exportCanvas, generateFilename, type ExportMimeType } from '../canvas/CanvasExporter'
import type Konva from 'konva'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
}

export function ExportPanel({ stageRef, originalFilename }: Props) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<{ url: string; revoke: () => void } | null>(null)
  const [mimeType, setMimeType] = useState<ExportMimeType>('image/jpeg')
  const [quality, setQuality] = useState(92)
  const [estimateBytes, setEstimateBytes] = useState<number | null>(null)
  const [estimating, setEstimating] = useState(false)

  const exportOptions = useMemo(() => ({
    mimeType,
    quality: quality / 100,
  }), [mimeType, quality])

  const showQuality = mimeType === 'image/jpeg' || mimeType === 'image/webp'

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    setEstimating(true)
    const id = window.setTimeout(() => {
      estimateExportSize(stage, exportOptions)
        .then((res) => setEstimateBytes(res.bytes))
        .catch(() => setEstimateBytes(null))
        .finally(() => setEstimating(false))
    }, 300)

    return () => window.clearTimeout(id)
  }, [exportOptions, stageRef])

  const formattedEstimate = useMemo(() => {
    if (estimating) return t('export.estimateEstimating')
    if (estimateBytes == null) return t('export.estimateUnavailable')
    const mb = estimateBytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    const kb = estimateBytes / 1024
    return `${kb.toFixed(0)} KB`
  }, [estimateBytes, estimating, t])

  const handleExport = async () => {
    if (!stageRef.current) return
    const toastId = toast.loading(t('export.processing'))
    try {
      const filename = generateFilename(originalFilename || 'photo', mimeType)
      const result = await exportCanvas(stageRef.current, filename, exportOptions)
      if (result.type === 'cancelled') {
        toast.dismiss(toastId)
        return
      }
      if (result.type === 'preview') {
        toast.dismiss(toastId)
        setPreview({ url: result.url, revoke: result.revoke })
        return
      }
      toast.success(t('export.success'), { id: toastId })
    } catch {
      toast.error(t('export.failed'), { id: toastId })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('export.formatLabel')}
          </div>
          <select
            value={mimeType}
            onChange={(e) => setMimeType(e.target.value as ExportMimeType)}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            <option value="image/jpeg">{t('export.format.jpeg')}</option>
            <option value="image/png">{t('export.format.png')}</option>
            <option value="image/webp">{t('export.format.webp')}</option>
          </select>
        </div>

        {showQuality && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('export.qualityLabel')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min={10}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    if (Number.isNaN(n)) return
                    setQuality(Math.max(10, Math.min(100, Math.round(n))))
                  }}
                  style={{
                    width: '64px',
                    padding: '3px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--bg-subtle)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'right',
                    outline: 'none',
                    appearance: 'textfield',
                    WebkitAppearance: 'none',
                  }}
                />
                <span style={{ width: '16px', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>%</span>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('export.estimateLabel')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {formattedEstimate}
          </div>
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

      {preview && typeof document !== 'undefined' && createPortal(
        <>
          <div
            onClick={() => {
              preview.revoke()
              setPreview(null)
            }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', zIndex: 230 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 231,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(560px, calc(100vw - 32px))',
                maxHeight: 'min(80dvh, 680px)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('export.previewTitle')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    preview.revoke()
                    setPreview(null)
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {t('export.previewHint')}
              </div>
              <div style={{ padding: '0 16px 16px', overflow: 'auto' }}>
                <img
                  src={preview.url}
                  alt="export"
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
