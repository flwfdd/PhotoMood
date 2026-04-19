import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useImageUpload } from '../../hooks/useImageUpload'

interface UploadAreaProps {
  onUpload: (file: File, originalFile: File, image: HTMLImageElement) => void
}

export function UploadArea({ onUpload }: UploadAreaProps) {
  const { t } = useTranslation()
  const { isUploading, processFile } = useImageUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const result = await processFile(file)
    if (result) onUpload(result.file, result.originalFile, result.image)
  }, [processFile, onUpload])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }, [handleFile])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile()
    if (file) await handleFile(file)
  }, [handleFile])

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
    e.target.value = ''
  }, [handleFile])

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'var(--bg-overlay)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1.05 }}
              style={{ color: 'var(--text-inverse)' }}
            >
              <ImagePlus size={64} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDraggingOver ? 'var(--accent)' : 'var(--bg-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '60px 48px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: isDraggingOver ? 'var(--accent-subtle)' : 'transparent',
          transition: 'all 300ms ease-out',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <motion.div
          animate={{ scale: isUploading ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: isUploading ? Infinity : 0, duration: 1 }}
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ImagePlus size={48} strokeWidth={1.5} />
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '16px',
            margin: '0 0 8px',
          }}>
            {isUploading ? t('upload.converting') : t('upload.title')}
          </p>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            margin: 0,
          }}>
            {t('upload.subtitle')}
          </p>
        </div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}
