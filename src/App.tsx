import { useRef, useCallback, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import './i18n'
import './styles/globals.css'
import { EditorProvider, useEditor } from './context/EditorContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { MobileToolbar } from './components/layout/MobileToolbar'
import { UploadArea } from './components/common/UploadArea'
import { CanvasPreview } from './components/canvas/CanvasPreview'
import { useExifData } from './hooks/useExifData'
import { useColorPalette } from './hooks/useColorPalette'
import type Konva from 'konva'

function EditorApp() {
  const { state, dispatch } = useEditor()
  const { extractExif } = useExifData()
  const { extractColors } = useColorPalette()
  const { i18n } = useTranslation()
  const stageRef = useRef<Konva.Stage | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [originalFilename, setOriginalFilename] = useState('photo')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleUpload = useCallback(async (file: File, image: HTMLImageElement) => {
    setOriginalFilename(file.name)
    dispatch({
      type: 'SET_IMAGE',
      payload: {
        original: image,
        size: { width: image.naturalWidth, height: image.naturalHeight },
      },
    })

    const [exifResult, colorResult] = await Promise.all([
      extractExif(file, i18n.language),
      extractColors(image),
    ])

    if (exifResult) {
      dispatch({ type: 'SET_EXIF', payload: exifResult })
    }
    if (colorResult) {
      dispatch({ type: 'SET_COLOR_PALETTE', payload: colorResult })
    }
  }, [dispatch, extractExif, extractColors, i18n.language])

  const hasImage = !!state.originalImage

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-base)',
    }}>
      <Header stageRef={stageRef} originalFilename={originalFilename} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
      }}>
        <main
          ref={canvasContainerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: hasImage ? '16px' : '0',
            minHeight: isMobile ? '50vh' : 'auto',
          }}
        >
          <AnimatePresence mode="wait">
            {!hasImage ? (
              <UploadArea key="upload" onUpload={handleUpload} />
            ) : (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <CanvasPreview
                  containerWidth={containerSize.width - 32}
                  containerHeight={containerSize.height - 32}
                  stageRef={stageRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {hasImage && !isMobile && <Sidebar />}
        {hasImage && isMobile && <MobileToolbar />}
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <EditorProvider>
      <EditorApp />
    </EditorProvider>
  )
}
