import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Globe, SunMoon, RefreshCw } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useImageUpload } from '../../hooks/useImageUpload'

const GITHUB_URL = 'https://github.com/flwfdd/PhotoMood'

function GitHubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.25 3.32.96.1-.74.4-1.25.72-1.54-2.56-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.17-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.14 1.17.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.73.8 1.17 1.82 1.17 3.07 0 4.41-2.68 5.39-5.24 5.67.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.12 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

export function Header({ onReplaceImage }: {
  onReplaceImage: (file: File, originalFile: File, image: HTMLImageElement) => Promise<void> | void
}) {
  const { t, i18n } = useTranslation()
  const { theme, cycleTheme } = useTheme()
  const { isUploading, processFile } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('zh') ? 'en' : 'zh')
  }

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.currentTarget.value = ''
    if (!file) return
    const result = await processFile(file)
    if (result) await onReplaceImage(result.file, result.originalFile, result.image)
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
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-primary)',
          fontSize: '22px',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {t('app.name')}
        </h1>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.heic,.heif"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={handlePickImage}
            title={t('common.replaceImage')}
            disabled={isUploading}
            style={{
              color: 'var(--text-secondary)', padding: '8px',
              borderRadius: 'var(--radius-sm)', border: 'none', background: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={20} />
          </button>

          <button
            onClick={toggleLanguage}
            title={t('language.' + (i18n.language.startsWith('zh') ? 'en' : 'zh'))}
            style={{
              color: 'var(--text-secondary)', padding: '8px',
              borderRadius: 'var(--radius-sm)', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <Globe size={20} />
          </button>

          <button
            onClick={cycleTheme}
            title={t('theme.' + nextTheme)}
            style={{
              color: 'var(--text-secondary)', padding: '8px',
              borderRadius: 'var(--radius-sm)', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            {theme === 'system' ? <SunMoon size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            title={t('common.github')}
            style={{
              color: 'var(--text-secondary)', padding: '8px',
              borderRadius: 'var(--radius-sm)', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </header>
  )
}
