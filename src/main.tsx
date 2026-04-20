import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './styles/globals.css'
import App from './App'
import { preloadBaseFonts } from './lib/font-loader'

preloadBaseFonts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
