import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Check } from 'lucide-react'
import { useEditor } from '../../context/EditorContext'

interface CropModalProps {
  open: boolean
  onClose: () => void
}

const PRESET_RATIOS = [
  { label: '自由', ratio: null as [number, number] | null },
  { label: '1:1', ratio: [1, 1] as [number, number] },
  { label: '3:2', ratio: [3, 2] as [number, number] },
  { label: '4:3', ratio: [4, 3] as [number, number] },
  { label: '16:9', ratio: [16, 9] as [number, number] },
  { label: '9:16', ratio: [9, 16] as [number, number] },
]

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function reduceRatio(width: number, height: number): [number, number] {
  const a = Math.max(1, Math.round(width))
  const b = Math.max(1, Math.round(height))
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))
  const d = gcd(a, b)
  return [Math.round(a / d), Math.round(b / d)]
}

function buildCropFromRatio(
  naturalWidth: number,
  naturalHeight: number,
  ratio: [number, number],
  focus: [number, number]
): CropRect {
  const targetRatio = ratio[0] / ratio[1]
  const imageRatio = naturalWidth / naturalHeight

  if (imageRatio > targetRatio) {
    const w = targetRatio / imageRatio
    return {
      x: clamp(focus[0] - w / 2, 0, 1 - w),
      y: 0,
      w,
      h: 1,
    }
  }

  const h = imageRatio / targetRatio
  return {
    x: 0,
    y: clamp(focus[1] - h / 2, 0, 1 - h),
    w: 1,
    h,
  }
}

export function CropModal({ open, onClose }: CropModalProps) {
  const { t } = useTranslation()
  const { state, dispatch } = useEditor()
  const image = state.originalImage
  const containerRef = useRef<HTMLDivElement>(null)
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 })
  const [activeRatio, setActiveRatio] = useState<[number, number] | null>(null)
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  const dragRef = useRef<{ type: 'move' | 'resize'; handle?: string; startX: number; startY: number; startCrop: CropRect } | null>(null)

  useEffect(() => {
    if (!open || !containerRef.current || !image) return
    const rect = containerRef.current.getBoundingClientRect()
    const maxW = rect.width
    const maxH = rect.height
    const imgRatio = image.naturalWidth / image.naturalHeight
    let w = maxW
    let h = w / imgRatio
    if (h > maxH) { h = maxH; w = h * imgRatio }
    setDisplaySize({ w, h })

    const layout = state.currentTemplate.layout
    if (layout.crop) {
      setCrop(layout.crop)
      if (layout.aspectRatio.mode === 'fixed' && layout.aspectRatio.ratio) {
        const [rw, rh] = layout.aspectRatio.ratio
        setActiveRatio([rw, rh])
      } else {
        setActiveRatio(null)
      }
    } else if (layout.aspectRatio.mode === 'fixed' && layout.aspectRatio.ratio) {
      const [rw, rh] = layout.aspectRatio.ratio
      setActiveRatio([rw, rh])
      setCrop(buildCropFromRatio(image.naturalWidth, image.naturalHeight, [rw, rh], state.cropFocus))
    } else {
      setCrop({ x: 0, y: 0, w: 1, h: 1 })
      setActiveRatio(null)
    }
  }, [open, image, state.currentTemplate.layout, state.cropFocus])

  const applyCropRatio = (ratio: [number, number] | null, base: CropRect, setter: typeof setCrop) => {
    if (!ratio || !image) { setter(base); return }
    const [rw, rh] = ratio
    const targetRatio = rw / rh
    const imgRatio = image.naturalWidth / image.naturalHeight
    let nw: number, nh: number
    if (imgRatio > targetRatio) {
      nh = base.h
      nw = (base.h * image.naturalHeight / image.naturalWidth) * targetRatio
    } else {
      nw = base.w
      nh = (base.w * image.naturalWidth / image.naturalHeight) / targetRatio
    }
    const nx = base.x + (base.w - nw) / 2
    const ny = base.y + (base.h - nh) / 2
    setter({ x: Math.max(0, nx), y: Math.max(0, ny), w: nw, h: nh })
  }

  const handleRatioSelect = (ratio: [number, number] | null) => {
    setActiveRatio(ratio)
    if (ratio) {
      applyCropRatio(ratio, crop, setCrop)
    }
  }

  const handleCustomRatio = () => {
    const w = parseFloat(customW)
    const h = parseFloat(customH)
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      const ratio: [number, number] = [w, h]
      setActiveRatio(ratio)
      applyCropRatio(ratio, crop, setCrop)
    }
  }

  const constrainCrop = useCallback((c: CropRect, ratio: [number, number] | null, handle?: string): CropRect => {
    let { x, y, w, h } = c
    if (ratio) {
      const [rw, rh] = ratio
      const targetRatio = rw / rh
      const widthFromHeight = (image!.naturalHeight / image!.naturalWidth) * targetRatio
      const heightFromWidth = (image!.naturalWidth / image!.naturalHeight) / targetRatio

      const hasWest = !!handle?.includes('w')
      const hasEast = !!handle?.includes('e')
      const hasNorth = !!handle?.includes('n')
      const hasSouth = !!handle?.includes('s')

      const anchorX = hasWest ? c.x + c.w : hasEast ? c.x : c.x + c.w / 2
      const anchorY = hasNorth ? c.y + c.h : hasSouth ? c.y : c.y + c.h / 2

      const maxW = hasWest
        ? anchorX
        : hasEast
          ? 1 - anchorX
          : 2 * Math.min(anchorX, 1 - anchorX)
      const maxH = hasNorth
        ? anchorY
        : hasSouth
          ? 1 - anchorY
          : 2 * Math.min(anchorY, 1 - anchorY)

      const verticalOnly = (hasNorth || hasSouth) && !(hasWest || hasEast)
      const horizontalOnly = (hasWest || hasEast) && !(hasNorth || hasSouth)

      if (verticalOnly) {
        h = Math.max(0.05, Math.min(c.h, maxH, maxW * heightFromWidth))
        w = h * widthFromHeight
      } else if (horizontalOnly) {
        w = Math.max(0.05, Math.min(c.w, maxW, maxH * widthFromHeight))
        h = w * heightFromWidth
      } else {
        w = Math.max(0.05, Math.min(c.w, maxW))
        h = w * heightFromWidth
        if (h > maxH) {
          h = maxH
          w = h * widthFromHeight
        }
      }

      x = hasWest ? anchorX - w : hasEast ? anchorX : anchorX - w / 2
      y = hasNorth ? anchorY - h : hasSouth ? anchorY : anchorY - h / 2
    } else {
      const hasWest = !!handle?.includes('w')
      const hasEast = !!handle?.includes('e')
      const hasNorth = !!handle?.includes('n')
      const hasSouth = !!handle?.includes('s')

      if (hasNorth) {
        const bottom = c.y + c.h
        y = Math.max(0, Math.min(bottom - 0.05, y))
        h = bottom - y
      } else if (hasSouth) {
        y = Math.max(0, Math.min(1 - 0.05, y))
        h = Math.max(0.05, Math.min(1 - y, h))
      } else {
        h = Math.max(0.05, Math.min(1 - y, h))
      }

      if (hasWest) {
        const right = c.x + c.w
        x = Math.max(0, Math.min(right - 0.05, x))
        w = right - x
      } else if (hasEast) {
        x = Math.max(0, Math.min(1 - 0.05, x))
        w = Math.max(0.05, Math.min(1 - x, w))
      } else {
        w = Math.max(0.05, Math.min(1 - x, w))
      }
    }

    x = Math.max(0, Math.min(1 - w, x))
    y = Math.max(0, Math.min(1 - h, y))
    return { x, y, w, h }
  }, [image])

  const clampMoveCrop = useCallback((c: CropRect): CropRect => ({
    x: clamp(c.x, 0, 1 - c.w),
    y: clamp(c.y, 0, 1 - c.h),
    w: c.w,
    h: c.h,
  }), [])

  const handlePointerDown = useCallback((e: React.PointerEvent, type: 'move' | 'resize', handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { type, handle, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } }
  }, [crop])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !displaySize.w) return
    e.preventDefault()
    const dx = (e.clientX - dragRef.current.startX) / displaySize.w
    const dy = (e.clientY - dragRef.current.startY) / displaySize.h
    const sc = dragRef.current.startCrop

    let next: CropRect
    if (dragRef.current.type === 'move') {
      next = clampMoveCrop({ x: sc.x + dx, y: sc.y + dy, w: sc.w, h: sc.h })
    } else {
      const h = dragRef.current.handle || 'se'
      let { x, y, w, h: ht } = sc
      if (h.includes('e')) w = sc.w + dx
      if (h.includes('s')) ht = sc.h + dy
      if (h.includes('w')) { x = sc.x + dx; w = sc.w - dx }
      if (h.includes('n')) { y = sc.y + dy; ht = sc.h - dy }
      next = constrainCrop({ x, y, w, h: ht }, activeRatio, h)
    }
    setCrop(next)
  }, [displaySize, activeRatio, clampMoveCrop, constrainCrop])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const handleConfirm = () => {
    if (!image) { onClose(); return }

    const focusX = crop.x + crop.w / 2
    const focusY = crop.y + crop.h / 2
    const cropWidth = crop.w * image.naturalWidth
    const cropHeight = crop.h * image.naturalHeight
    const finalRatio = activeRatio ?? reduceRatio(cropWidth, cropHeight)

    dispatch({ type: 'SET_CROP_FOCUS', payload: [focusX, focusY] })
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: {
        aspectRatio: { mode: 'fixed', ratio: finalRatio },
        crop: crop,
      },
    })
    onClose()
  }

  if (!open || !image) return null

  const imgLeft = displaySize.w > 0 ? `calc(50% - ${displaySize.w / 2}px)` : '0'
  const imgTop = displaySize.h > 0 ? `calc(50% - ${displaySize.h / 2}px)` : '0'

  const cropPx = {
    left: crop.x * displaySize.w,
    top: crop.y * displaySize.h,
    w: crop.w * displaySize.w,
    h: crop.h * displaySize.h,
  }

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  const handlePos: Record<string, React.CSSProperties> = {
    nw: { top: -5, left: -5, cursor: 'nwse-resize' },
    n: { top: -5, left: `calc(50% - 5px)`, cursor: 'ns-resize' },
    ne: { top: -5, right: -5, cursor: 'nesw-resize' },
    e: { top: `calc(50% - 5px)`, right: -5, cursor: 'ew-resize' },
    se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
    s: { bottom: -5, left: `calc(50% - 5px)`, cursor: 'ns-resize' },
    sw: { bottom: -5, left: -5, cursor: 'nesw-resize' },
    w: { top: `calc(50% - 5px)`, left: -5, cursor: 'ew-resize' },
  }

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--bg-subtle)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('editor.cropTitle')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)', background: 'var(--bg-surface)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
          <button
            onClick={handleConfirm}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'var(--accent)',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}
          >
            <Check size={14} />
            {t('editor.cropConfirm')}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}
      >
        {displaySize.w > 0 && (
          <div style={{ position: 'absolute', left: imgLeft, top: imgTop, width: displaySize.w, height: displaySize.h }}>
            <img
              src={image.src}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', userSelect: 'none' }}
              draggable={false}
            />

            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${crop.y * 100}%,
                ${crop.x * 100}% ${crop.y * 100}%,
                ${crop.x * 100}% ${(crop.y + crop.h) * 100}%,
                ${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%,
                ${(crop.x + crop.w) * 100}% ${crop.y * 100}%,
                0% ${crop.y * 100}%
              )`,
              pointerEvents: 'none',
            }} />

            <div
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              style={{
                position: 'absolute',
                left: cropPx.left,
                top: cropPx.top,
                width: cropPx.w,
                height: cropPx.h,
                border: '2px solid rgba(255,255,255,0.9)',
                boxSizing: 'border-box',
                cursor: 'move',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%',
              }} />

              {handles.map((h) => (
                <div
                  key={h}
                  onPointerDown={(e) => handlePointerDown(e, 'resize', h)}
                  style={{
                    position: 'absolute',
                    width: 10,
                    height: 10,
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0,0,0,0.4)',
                    borderRadius: '2px',
                    ...handlePos[h],
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        flexShrink: 0,
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 94%, transparent)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--bg-subtle)',
        padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
          {PRESET_RATIOS.map(({ label, ratio }) => {
            const isActive = ratio === null
              ? activeRatio === null
              : activeRatio?.[0] === ratio[0] && activeRatio?.[1] === ratio[1]
            return (
              <button
                key={label}
                onClick={() => handleRatioSelect(ratio)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '999px',
                  border: '1px solid var(--bg-subtle)',
                  background: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="W"
            value={customW}
            onChange={(e) => setCustomW(e.target.value)}
            style={{
              width: '48px', padding: '8px 6px', fontSize: '12px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
              outline: 'none', textAlign: 'center',
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>:</span>
          <input
            type="text"
            placeholder="H"
            value={customH}
            onChange={(e) => setCustomH(e.target.value)}
            style={{
              width: '48px', padding: '8px 6px', fontSize: '12px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-subtle)',
              backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
              outline: 'none', textAlign: 'center',
            }}
          />
          <button
            onClick={handleCustomRatio}
            style={{
              padding: '8px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--bg-subtle)', background: 'var(--bg-surface)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {t('editor.cropApply')}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
