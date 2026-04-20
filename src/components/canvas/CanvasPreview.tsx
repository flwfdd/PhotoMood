import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group, Line } from 'react-konva'
import { motion } from 'framer-motion'
import { useEditor } from '../../context/EditorContext'
import { resolveColor } from '../../lib/color-resolve'
import { buildExifMap, renderTemplate } from '../../lib/template-parser'
import { ensureFontLoaded } from '../../lib/font-loader'
import type { TextElement } from '../../types/template'
import type Konva from 'konva'
import { useTranslation } from 'react-i18next'

interface CanvasPreviewProps {
  containerWidth: number
  containerHeight: number
  stageRef: React.RefObject<Konva.Stage | null>
}

interface GuideLines {
  x: number[]
  y: number[]
}

const SNAP_THRESHOLD = 8
const MAX_PREVIEW_CANVAS_SIDE = 2048
const BLEND_MODE_MAP = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  difference: 'difference',
} as const

function measureTextBox(text: string, element: TextElement, canvasW: number) {
  const fontSize = Math.max(element.style.fontSize * canvasW, 8)
  const lines = text.split('\n')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { width: fontSize, height: fontSize * element.style.lineHeight, fontSize }
  }

  ctx.font = `${element.style.fontWeight} ${fontSize}px "${element.style.fontFamily}"`
  let width = 0
  for (const line of lines) {
    const baseWidth = ctx.measureText(line || ' ').width
    const spacingWidth = Math.max(0, line.length - 1) * element.style.letterSpacing * fontSize
    width = Math.max(width, baseWidth + spacingWidth)
  }

  return {
    width: Math.max(width + fontSize * 0.4, fontSize * 1.2),
    height: Math.max(lines.length, 1) * fontSize * element.style.lineHeight,
    fontSize,
  }
}

function getTextOffsets(element: TextElement, boxWidth: number, boxHeight: number) {
  const x = element.align === 'left' ? 0 : element.align === 'center' ? -boxWidth / 2 : -boxWidth
  const y = element.verticalAlign === 'top' ? 0 : element.verticalAlign === 'middle' ? -boxHeight / 2 : -boxHeight
  return { x, y }
}

function getSnapPoints(
  elements: TextElement[],
  activeId: string,
  imageX: number,
  imageY: number,
  imageW: number,
  imageH: number
): { x: number[]; y: number[] } {
  const imageCenterX = imageX + imageW / 2
  const imageCenterY = imageY + imageH / 2

  const snapX = [imageX, imageCenterX, imageX + imageW]
  const snapY = [imageY, imageCenterY, imageY + imageH]

  for (const el of elements) {
    if (el.id === activeId) continue
    const elX = el.position.x * imageW + imageCenterX
    const elY = el.position.y * imageH + imageCenterY
    snapX.push(elX)
    snapY.push(elY)
  }

  return { x: snapX, y: snapY }
}

function snapValue(val: number, snaps: number[], threshold: number): { value: number; snapped: boolean; guide?: number } {
  for (const s of snaps) {
    if (Math.abs(val - s) <= threshold) {
      return { value: s, snapped: true, guide: s }
    }
  }
  return { value: val, snapped: false }
}

export function CanvasPreview({ containerWidth, containerHeight, stageRef }: CanvasPreviewProps) {
  const { state, dispatch } = useEditor()
  useTranslation()
  const [guideLines, setGuideLines] = useState<GuideLines>({ x: [], y: [] })
  const [, forceTextMeasureTick] = useState(0)
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const template = state.currentTemplate
  const image = state.croppedImage ?? state.originalImage

  const rawW = state.imageSize.width || 1
  const rawH = state.imageSize.height || 1

  const { aspectRatio, padding, imageCornerRadius, frameColor, crop } = template.layout

  let imgW = rawW
  let imgH = rawH
  let cropX = 0
  let cropY = 0
  let cropW = rawW
  let cropH = rawH

  if (crop) {
    cropX = crop.x * rawW
    cropY = crop.y * rawH
    cropW = crop.w * rawW
    cropH = crop.h * rawH
    imgW = cropW
    imgH = cropH
  } else if (aspectRatio.mode === 'fixed' && aspectRatio.ratio) {
    const [rw, rh] = aspectRatio.ratio
    const targetRatio = rw / rh
    const srcRatio = rawW / rawH

    if (srcRatio > targetRatio) {
      cropH = rawH
      cropW = rawH * targetRatio
      const focusX = state.cropFocus[0]
      cropX = Math.max(0, Math.min(rawW - cropW, focusX * rawW - cropW / 2))
    } else {
      cropW = rawW
      cropH = rawW / targetRatio
      const focusY = state.cropFocus[1]
      cropY = Math.max(0, Math.min(rawH - cropH, focusY * rawH - cropH / 2))
    }

    imgW = cropW
    imgH = cropH
  }

  // Padding is expressed as a percentage of the image dimension per axis:
  // - top/bottom are relative to image height
  // - left/right are relative to image width
  // This makes "100%" intuitive (top=100% means padTop equals image height).
  const padTop = imgH * padding.top
  const padRight = imgW * padding.right
  const padBottom = imgH * padding.bottom
  const padLeft = imgW * padding.left

  const rawCanvasW = imgW + padLeft + padRight
  const rawCanvasH = imgH + padTop + padBottom
  const previewNormalizationScale = Math.min(1, MAX_PREVIEW_CANVAS_SIDE / Math.max(rawCanvasW, rawCanvasH))

  imgW *= previewNormalizationScale
  imgH *= previewNormalizationScale
  const normalizedShortSide = Math.min(imgW, imgH)
  const normalizedPadTop = padTop * previewNormalizationScale
  const normalizedPadLeft = padLeft * previewNormalizationScale

  const canvasW = rawCanvasW * previewNormalizationScale
  const canvasH = rawCanvasH * previewNormalizationScale

  const imageX = normalizedPadLeft
  const imageY = normalizedPadTop

  const colorContext = { dominantColor: state.dominantColor, palette: state.palette, swatches: state.swatches }
  const resolvedFrame = resolveColor(frameColor, colorContext)

  const scale = containerWidth > 0 && containerHeight > 0
    ? Math.min(containerWidth / canvasW, containerHeight / canvasH)
    : 1

  const stageW = canvasW * scale
  const stageH = canvasH * scale

  const exifMap = useMemo(() => buildExifMap(state.exifData), [state.exifData])

  const fontLoadSignature = useMemo(() => {
    const textElements = template.elements.filter((e): e is TextElement => e.type === 'text')
    return textElements
      .map((e) => `${e.style.fontFamily}|${e.style.fontWeight}|${e.content}`)
      .sort()
      .join('||')
  }, [template.elements])

  useEffect(() => {
    const textElements = template.elements.filter((e): e is TextElement => e.type === 'text')
    if (textElements.length === 0) return
    let cancelled = false

    const byFamily = new Map<string, { weights: Set<TextElement['style']['fontWeight']>; text: string }>()
    for (const el of textElements) {
      const entry = byFamily.get(el.style.fontFamily) ?? { weights: new Set<TextElement['style']['fontWeight']>(), text: '' }
      entry.weights.add(el.style.fontWeight)
      const { rendered } = renderTemplate(el.content, exifMap)
      entry.text += rendered
      byFamily.set(el.style.fontFamily, entry)
    }

    Promise.all(
      Array.from(byFamily.entries()).map(([family, info]) =>
        ensureFontLoaded({
          family,
          weights: Array.from(info.weights),
          text: info.text,
        })
      )
    ).then(() => {
      if (cancelled) return
      stageRef.current?.batchDraw()
      // batchDraw repaints Konva, but our text layout depends on measureTextBox()
      // which runs during React render. Force a re-render so sizes/offsets are
      // recalculated after fonts finish loading (avoids "fixed after hover").
      forceTextMeasureTick((v) => v + 1)
    })
    return () => { cancelled = true }
  }, [exifMap, fontLoadSignature, stageRef, template.elements])

  const handleDragMove = useCallback(
    (el: TextElement, node: Konva.Group) => {
      const imageCenterX = imageX + imgW / 2
      const imageCenterY = imageY + imgH / 2

      const textElements = template.elements.filter((e): e is TextElement => e.type === 'text')
      const snaps = getSnapPoints(textElements, el.id, imageX, imageY, imgW, imgH)

      const snapX = snapValue(node.x(), snaps.x, SNAP_THRESHOLD / scale)
      const snapY = snapValue(node.y(), snaps.y, SNAP_THRESHOLD / scale)

      const guides: GuideLines = { x: [], y: [] }
      if (snapX.snapped && snapX.guide != null) guides.x.push(snapX.guide)
      if (snapY.snapped && snapY.guide != null) guides.y.push(snapY.guide)
      setGuideLines(guides)

      node.position({ x: snapX.value, y: snapY.value })

      const newX = (snapX.value - imageCenterX) / imgW
      const newY = (snapY.value - imageCenterY) / imgH

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: { id: el.id, updates: { position: { x: newX, y: newY } } },
      })
    },
    [imageX, imageY, imgW, imgH, scale, template.elements, dispatch]
  )

  const handleDragEnd = useCallback(() => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
    dragTimeoutRef.current = setTimeout(() => setGuideLines({ x: [], y: [] }), 300)
  }, [])

  if (!image) return null

  const imageCenterX = imageX + imgW / 2
  const imageCenterY = imageY + imgH / 2
  const cornerRadius = imageCornerRadius * normalizedShortSide

  const frameRgb = resolvedFrame.color.replace('#', '')
  const r = parseInt(frameRgb.substring(0, 2), 16)
  const g = parseInt(frameRgb.substring(2, 4), 16)
  const b = parseInt(frameRgb.substring(4, 6), 16)
  const frameFill = resolvedFrame.opacity < 1
    ? `rgba(${r},${g},${b},${resolvedFrame.opacity})`
    : resolvedFrame.color

  return (
    <motion.div
      initial={false}
      animate={{ width: stageW, height: stageH }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        width: `${stageW}px`,
        height: `${stageH}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      <motion.div
        initial={false}
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: `${canvasW}px`,
          height: `${canvasH}px`,
          transformOrigin: 'center center',
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasW}
          height={canvasH}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvasW}
              height={canvasH}
              fill={frameFill}
            />

            <KonvaImage
              image={image}
              x={imageX}
              y={imageY}
              width={imgW}
              height={imgH}
              cornerRadius={cornerRadius}
              crop={crop || aspectRatio.mode === 'fixed' ? { x: cropX, y: cropY, width: cropW, height: cropH } : undefined}
              opacity={template.layout.imageOpacity ?? 1}
            />

            {template.elements.map((el) => {
              if (el.type !== 'text') return null
              const textEl = el as TextElement

              const { rendered, unresolvedFields } = renderTemplate(textEl.content, exifMap)
              const hasUnresolved = unresolvedFields.length > 0
              const box = measureTextBox(rendered, textEl, canvasW)
              const offsets = getTextOffsets(textEl, box.width, box.height)
              const resolvedColor = resolveColor(textEl.style.color, colorContext)
              const colorHex = resolvedColor.color.replace('#', '')
              const cr = parseInt(colorHex.substring(0, 2), 16)
              const cg = parseInt(colorHex.substring(2, 4), 16)
              const cb = parseInt(colorHex.substring(4, 6), 16)
              const fillColor = resolvedColor.opacity < 1
                ? `rgba(${cr},${cg},${cb},${resolvedColor.opacity})`
                : resolvedColor.color

              const absoluteX = textEl.position.x * imgW + imageCenterX
              const absoluteY = textEl.position.y * imgH + imageCenterY

              return (
                <Group
                  key={textEl.id}
                  x={absoluteX}
                  y={absoluteY}
                  draggable
                  onClick={() => {
                    dispatch({ type: 'SELECT_TEXT_ELEMENT', payload: textEl.id })
                    dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'text' })
                  }}
                  onTap={() => {
                    dispatch({ type: 'SELECT_TEXT_ELEMENT', payload: textEl.id })
                    dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'text' })
                  }}
                  onDragMove={(e) => handleDragMove(textEl, e.target as Konva.Group)}
                  onDragEnd={handleDragEnd}
                >
                  <Text
                    x={offsets.x}
                    y={offsets.y}
                    text={rendered}
                    align={textEl.align}
                    fontFamily={textEl.style.fontFamily}
                    fontSize={box.fontSize}
                    fontStyle={String(textEl.style.fontWeight)}
                    fill={hasUnresolved ? '#C15F3C' : fillColor}
                    letterSpacing={textEl.style.letterSpacing * box.fontSize}
                    lineHeight={textEl.style.lineHeight}
                    wrap="none"
                    ellipsis={false}
                    width={box.width}
                    globalCompositeOperation={BLEND_MODE_MAP[textEl.style.blendMode ?? 'normal']}
                  />
                </Group>
              )
            })}

            {guideLines.x.map((gx, i) => (
              <Line
                key={`gx-${i}`}
                points={[gx, 0, gx, canvasH]}
                stroke="#4099FF"
                strokeWidth={1 / scale}
                dash={[4 / scale, 4 / scale]}
              />
            ))}
            {guideLines.y.map((gy, i) => (
              <Line
                key={`gy-${i}`}
                points={[0, gy, canvasW, gy]}
                stroke="#4099FF"
                strokeWidth={1 / scale}
                dash={[4 / scale, 4 / scale]}
              />
            ))}
          </Layer>
        </Stage>
      </motion.div>
    </motion.div>
  )
}
