import { useTranslation } from 'react-i18next'
import { Sun, Moon, Globe } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function Header({ stageRef: _stageRef, originalFilename: _originalFilename }: {
  stageRef: React.RefObject<unknown>
  originalFilename: string
}) {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

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
            onClick={toggleTheme}
            title={t('theme.' + (theme === 'dark' ? 'light' : 'dark'))}
            style={{
              color: 'var(--text-secondary)', padding: '8px',
              borderRadius: 'var(--radius-sm)', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
