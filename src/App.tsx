import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
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
import { getTemplateFromUrlHash } from './lib/template-share'
import type Konva from 'konva'

function EditorApp() {
  const { state, dispatch } = useEditor()
  const { extractExif } = useExifData()
  const { extractColors } = useColorPalette()
  const { i18n } = useTranslation()
  const extractionCrop = state.currentTemplate.layout.crop
  const extractionAspectRatio = state.currentTemplate.layout.aspectRatio
  const colorExtractionLayout = useMemo(() => ({
    crop: extractionCrop
      ? { ...extractionCrop }
      : null,
    aspectRatio: extractionAspectRatio.ratio
      ? {
        ...extractionAspectRatio,
        ratio: [...extractionAspectRatio.ratio] as [number, number],
      }
      : { ...extractionAspectRatio },
  }), [extractionCrop, extractionAspectRatio])
  const stageRef = useRef<Konva.Stage | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [originalFilename, setOriginalFilename] = useState('photo')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileHeights, setMobileHeights] = useState({ toolbar: 57, drawer: 0 })
  const [importedTemplateFromLinkName, setImportedTemplateFromLinkName] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const tpl = getTemplateFromUrlHash()
    if (tpl) {
      dispatch({ type: 'SET_TEMPLATE', payload: tpl })
      const templateName = typeof tpl.name === 'string'
        ? tpl.name
        : (i18n.language.startsWith('zh') ? tpl.name.zh : tpl.name.en)
      requestAnimationFrame(() => setImportedTemplateFromLinkName(templateName))
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [dispatch, i18n.language])

  useEffect(() => {
    if (!state.originalImage) return

    const controller = new AbortController()
    extractColors(state.originalImage, {
      layout: colorExtractionLayout,
      cropFocus: state.cropFocus,
      signal: controller.signal,
    })
      .then((colorResult) => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'SET_COLOR_PALETTE', payload: colorResult })
        }
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Failed to extract colors', error)
        }
      })

    return () => controller.abort()
  }, [
    dispatch,
    colorExtractionLayout,
    extractColors,
    state.originalImage,
    state.cropFocus,
  ])

  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleUpload = useCallback(async (file: File, originalFile: File, image: HTMLImageElement) => {
    setOriginalFilename(file.name || 'photo')
    setImportedTemplateFromLinkName(null)
    dispatch({ type: 'SET_IMAGE', payload: { original: image, size: { width: image.naturalWidth, height: image.naturalHeight } } })

    const exifResult = await extractExif(originalFile, i18n.language)
    if (exifResult) dispatch({ type: 'SET_EXIF', payload: exifResult })
  }, [dispatch, extractExif, i18n.language])

  const hasImage = !!state.originalImage
  const isMobilePanelOpen = isMobile && !!state.activePanel
  const mobileDrawerHeight = isMobilePanelOpen ? mobileHeights.drawer : 0
  const mobileOccludedHeight = isMobile && hasImage && isMobilePanelOpen ? mobileDrawerHeight : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      <Header onReplaceImage={handleUpload} />

      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden', minHeight: 0 }}>
        <main
          ref={canvasContainerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            paddingLeft: hasImage ? 16 : 0,
            paddingRight: hasImage ? 16 : 0,
            minHeight: 0,
          }}
        >
          <AnimatePresence mode="wait">
            {!hasImage ? (
              <UploadArea key="upload" onUpload={handleUpload} importedTemplateFromLinkName={importedTemplateFromLinkName} />
            ) : (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, y: 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: hasImage && isMobile ? `calc(100% - ${mobileOccludedHeight}px)` : '100%',
                  marginBottom: hasImage && isMobile ? mobileOccludedHeight : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: 0,
                }}
              >
                <CanvasPreview
                  containerWidth={containerSize.width - 32}
                  containerHeight={isMobile ? containerSize.height - mobileOccludedHeight : containerSize.height - 32}
                  stageRef={stageRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {hasImage && !isMobile && <Sidebar stageRef={stageRef} originalFilename={originalFilename} />}
        {hasImage && isMobile && (
          <MobileToolbar
            stageRef={stageRef}
            originalFilename={originalFilename}
            onHeightsChange={setMobileHeights}
          />
        )}
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
