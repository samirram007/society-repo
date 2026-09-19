import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCcw, ZoomIn, ZoomOut, Check, X } from 'lucide-react'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedDataUrl: string) => void
  outputSize?: number // output px (default 400)
}

const OUTPUT_SIZE = 400

export function ImageCropDialog(props: ImageCropDialogProps) {
  const { open, onOpenChange, imageSrc, onCropComplete } = props
  const outputSize = props.outputSize ?? OUTPUT_SIZE
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // Crop state
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Image natural dimensions
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })

  // Reset on new image
  useEffect(() => {
    if (open && imageSrc) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      const img = new Image()
      // Only set crossOrigin for external URLs (not data: or same-origin)
      if (imageSrc.startsWith('http') && !imageSrc.includes(window.location.host)) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => {
        imgRef.current = img
        setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
      }
      img.onerror = () => {
        console.error('Failed to load image for cropping')
      }
      img.src = imageSrc
    }
  }, [open, imageSrc])

  // Measure container
  useEffect(() => {
    if (!open || !containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [open])

  // Draw preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !imgRef.current) return

    const img = imgRef.current
    const cw = container.clientWidth
    const ch = container.clientHeight
    canvas.width = cw
    canvas.height = ch

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, cw, ch)

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, cw, ch)

    // Crop circle in center
    const radius = Math.min(cw, ch) / 2
    const cx = cw / 2
    const cy = ch / 2

    // Clear circle (knockout)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()

    // Draw image inside circle
    const scale = zoom
    const imgW = img.naturalWidth * scale
    const imgH = img.naturalHeight * scale

    // Fit image to cover the circle
    const fitScale = Math.max(radius * 2 / img.naturalWidth, radius * 2 / img.naturalHeight) * scale
    const drawW = img.naturalWidth * fitScale
    const drawH = img.naturalHeight * fitScale
    const drawX = cx - drawW / 2 + offset.x
    const drawY = cy - drawH / 2 + offset.y

    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.restore()

    // Circle border
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [zoom, offset, containerSize])

  useEffect(() => {
    if (open) drawPreview()
  }, [open, zoom, offset, containerSize, drawPreview])

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Generate cropped output
  const handleCrop = () => {
    const img = imgRef.current
    if (!img) return

    const offscreen = document.createElement('canvas')
    offscreen.width = outputSize
    offscreen.height = outputSize
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    const cw = containerRef.current?.clientWidth || 300
    const ch = containerRef.current?.clientHeight || 300
    const radius = Math.min(cw, ch) / 2
    const cx = cw / 2
    const cy = ch / 2

    // Same math as drawPreview
    const fitScale = Math.max(radius * 2 / img.naturalWidth, radius * 2 / img.naturalHeight) * zoom
    const drawW = img.naturalWidth * fitScale
    const drawH = img.naturalHeight * fitScale
    const drawX = cx - drawW / 2 + offset.x
    const drawY = cy - drawH / 2 + offset.y

    // Map container coords → output coords
    const scale = outputSize / (radius * 2)

    ctx.beginPath()
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      img,
      drawX * scale,
      drawY * scale,
      drawW * scale,
      drawH * scale,
    )

    const dataUrl = offscreen.toDataURL('image/jpeg', 0.9)
    onCropComplete(dataUrl)
    onOpenChange(false)
  }

  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Crop Profile Image</DialogTitle>
        </DialogHeader>

        {/* Crop canvas area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-black cursor-crosshair select-none mx-auto"
          style={{ maxWidth: 360 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={50}
              max={300}
              step={5}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="flex-1 h-2 rounded-full bg-muted appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Drag to reposition · Zoom to resize · Output: {outputSize}×{outputSize}px
          </p>
        </div>

        <DialogFooter className="px-6 pb-6 gap-2">
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="mr-1 h-3 w-3" /> Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            <X className="mr-1 h-3 w-3" /> Cancel
          </Button>
          <Button onClick={handleCrop} size="sm">
            <Check className="mr-1 h-3 w-3" /> Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
