import { useTranslation } from 'react-i18next'
import { Sun, Moon, Globe, Download } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useEditor } from '../../context/EditorContext'
import { exportCanvas, generateFilename } from '../canvas/CanvasExporter'
import { toast } from 'sonner'
import type Konva from 'konva'

interface HeaderProps {
  stageRef: React.RefObject<Konva.Stage | null>
  originalFilename: string
}

export function Header({ stageRef, originalFilename }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { state } = useEditor()

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

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('zh') ? 'en' : 'zh')
  }

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--bg-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            fontSize: '22px',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          {t('app.name')}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            title={t('language.' + (i18n.language.startsWith('zh') ? 'en' : 'zh'))}
            style={{
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Globe size={20} />
          </button>

          <button
            onClick={toggleTheme}
            title={t('theme.' + (theme === 'dark' ? 'light' : 'dark'))}
            style={{
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {state.originalImage && (
            <button
              onClick={handleExport}
              style={{
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Download size={16} />
              <span className="hidden sm:inline">{t('export.button')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
