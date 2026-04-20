import { useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('photo-mood-theme') as ThemeMode | null
    if (stored) return stored
    return 'system'
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolvedTheme = theme === 'system'
        ? (media.matches ? 'dark' : 'light')
        : theme
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }

    applyTheme()
    localStorage.setItem('photo-mood-theme', theme)
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  const cycleTheme = () => {
    setTheme((current) => {
      if (current === 'system') return 'light'
      if (current === 'light') return 'dark'
      return 'system'
    })
  }

  return { theme, cycleTheme }
}
