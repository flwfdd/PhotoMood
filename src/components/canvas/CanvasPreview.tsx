import { useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group } from 'react-konva'
import { useEditor } from '../../context/EditorContext'
import { getTemplate } from '../../templates/registry'
import {
  formatShutterSpeed,
  formatFocalLength,
  formatAperture,
  formatDate,
} from '../../lib/exif-parser'
import type { TextAreaDefinition } from '../../types/template'
import type Konva from 'konva'
import { useTranslation } from 'react-i18next'

interface CanvasPreviewProps {
  containerWidth: number
  containerHeight: number
  stageRef: React.RefObject<Konva.Stage | null>
}

function formatExifValue(
  field: string,
  value: unknown,
  format: string | undefined,
  locale: string
): string {
  if (value == null) return ''
  if (field === 'exposureTime' && typeof value === 'number') return formatShutterSpeed(value)
  if (field === 'focalLength' && typeof value === 'number') return formatFocalLength(value)
  if (field === 'fNumber' && typeof value === 'number') return formatAperture(value)
  if (field === 'dateTimeOriginal' && value instanceof Date) return formatDate(value, locale)
  if (format) return format.replace('{value}', String(value))
  return String(value)
}

export function CanvasPreview({ containerWidth, containerHeight, stageRef }: CanvasPreviewProps) {
  const { state } = useEditor()
  const { i18n } = useTranslation()
  const [scale, setScale] = useState(1)

  const template = getTemplate(state.currentTemplateId)
  const image = state.croppedImage ?? state.originalImage

  const imgW = state.imageSize.width || 1
  const imgH = state.imageSize.height || 1

  const padding = {
    ...((template?.layout.padding) ?? { top: 0.03, right: 0.03, bottom: 0.15, left: 0.03 }),
    ...(state.templateOverrides.padding ?? {}),
  }

  const shortSide = Math.min(imgW, imgH)
  const padTop = padding.top >= 1 ? imgH * (padding.top - 1 > 0 ? 1 : 1) : shortSide * padding.top
  const padRight = shortSide * padding.right
  const padBottom = shortSide * padding.bottom
  const padLeft = shortSide * padding.left

  const isHalfTemplate = padding.top >= 1
  const actualPadTop = isHalfTemplate ? imgH : padTop

  const canvasW = imgW + padLeft + padRight
  const canvasH = imgH + actualPadTop + padBottom

  useEffect(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return
    const scaleX = containerWidth / canvasW
    const scaleY = containerHeight / canvasH
    setScale(Math.min(scaleX, scaleY, 1))
  }, [containerWidth, containerHeight, canvasW, canvasH])

  const stageW = canvasW * scale
  const stageH = canvasH * scale

  const frameColor = template?.layout.frameColorMode === 'fixed'
    ? (template.layout.frameColorFixed ?? state.frameColor)
    : state.frameColor

  const textColor = state.textColor

  const textAreas: TextAreaDefinition[] = [
    ...(template?.layout.textAreas ?? []),
  ]

  const getTextForArea = (areaId: string): string => {
    const fields = template?.defaultExifFields.filter(
      (f) => f.textAreaId === areaId && state.selectedExifFields.includes(f.field as string)
    ) ?? []

    const parts = fields
      .map((f) => {
        const override = state.textOverrides[`${areaId}-${f.field}`]
        if (override?.content != null) return override.content
        if (!state.exifData) return ''
        const value = state.exifData[f.field]
        return formatExifValue(f.field as string, value, f.format, i18n.language)
      })
      .filter(Boolean)

    const override = state.textOverrides[areaId]
    if (override?.content != null) return override.content

    return parts.join('  ')
  }

  const handleDragEnd = useCallback((_areaId: string, _x: number, _y: number) => {
  }, [])

  if (!image) return null

  const textStyle = template?.defaultTextStyle
  const baseFontSize = (textStyle?.fontSize ?? 14) * scale * (canvasW / 1000)
  const fontFamily = textStyle?.fontFamily ?? 'JetBrains Mono'

  return (
    <Stage
      ref={stageRef}
      width={stageW}
      height={stageH}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={canvasW}
          height={canvasH}
          fill={frameColor === 'transparent' ? undefined : frameColor}
          cornerRadius={template?.layout.frameCornerRadius ?? 0}
        />

        <KonvaImage
          image={image}
          x={padLeft}
          y={actualPadTop}
          width={imgW}
          height={imgH}
        />

        {template?.id === 'clean' && (
          <Rect
            x={padLeft}
            y={actualPadTop + imgH * 0.75}
            width={imgW}
            height={imgH * 0.25}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: imgH * 0.25 }}
            fillLinearGradientColorStops={[0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.55)']}
          />
        )}

        {textAreas.map((area) => {
          const text = getTextForArea(area.id)
          if (!text) return null

          const areaTextColor = template?.id === 'clean' ? '#FFFFFF' : textColor

          const posOverride = state.textOverrides[area.id]?.position
          const x = posOverride ? posOverride.x : area.x * canvasW
          const y = posOverride ? posOverride.y : area.y * canvasH

          return (
            <Group
              key={area.id}
              x={x}
              y={y}
              draggable
              onDragEnd={(e) => handleDragEnd(area.id, e.target.x(), e.target.y())}
              dragBoundFunc={(pos) => ({
                x: Math.max(0, Math.min(canvasW - area.width * canvasW, pos.x)),
                y: Math.max(0, Math.min(canvasH - area.height * canvasH, pos.y)),
              })}
            >
              <Text
                text={text}
                width={area.width * canvasW}
                height={area.height * canvasH}
                align={area.align}
                verticalAlign={area.verticalAlign}
                fontFamily={fontFamily}
                fontSize={Math.max(baseFontSize, 10)}
                fontStyle={String(textStyle?.fontWeight ?? 400)}
                fill={areaTextColor}
                letterSpacing={textStyle?.letterSpacing}
                lineHeight={textStyle?.lineHeight}
                wrap="none"
                ellipsis
              />
            </Group>
          )
        })}
      </Layer>
    </Stage>
  )
}
