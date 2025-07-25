import { createSignal, onCleanup, onMount, createEffect } from 'solid-js'
import { type BoundingBox } from '../utils/boundingBoxExtractor'

export interface BoundingBoxOverlayProps {
  boundingBox: BoundingBox | null
  isVisible: boolean
  color?: string
  thickness?: number
  opacity?: number
}

export default function BoundingBoxOverlay(props: BoundingBoxOverlayProps) {
  const [overlayElement, setOverlayElement] = createSignal<HTMLDivElement | null>(null)

  const color = () => props.color || '#3b82f6' // blue-500
  const thickness = () => props.thickness || 2
  const opacity = () => props.opacity || 0.8

  // Update overlay position and size when bounding box changes
  const updateOverlay = () => {
    const overlay = overlayElement()
    const box = props.boundingBox
    const visible = props.isVisible
    
    console.log('BoundingBoxOverlay updateOverlay:', { box, visible, overlay: !!overlay })
    
    if (!overlay || !box || !visible) {
      if (overlay) {
        overlay.style.display = 'none'
      }
      return
    }

    console.log('Setting overlay styles:', {
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height
    })

    overlay.style.display = 'block'
    overlay.style.position = 'fixed'
    overlay.style.top = `${box.top}px`
    overlay.style.left = `${box.left}px`
    overlay.style.width = `${box.width}px`
    overlay.style.height = `${box.height}px`
    overlay.style.border = `${thickness()}px solid ${color()}`
    overlay.style.backgroundColor = 'transparent'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '9999'
    overlay.style.opacity = opacity().toString()
    overlay.style.boxSizing = 'border-box'
  }

  // Reactive effect to update overlay when props change
  createEffect(() => {
    const box = props.boundingBox
    const visible = props.isVisible
    console.log('BoundingBoxOverlay effect triggered:', { box, visible })
    updateOverlay()
  })

  onCleanup(() => {
    const overlay = overlayElement()
    if (overlay) {
      overlay.remove()
    }
  })

  return (
    <div
      ref={setOverlayElement}
      class="bounding-box-overlay"
      style={{
        display: 'none',
        position: 'fixed',
        'pointer-events': 'none',
        'z-index': '9999'
      }}
    />
  )
}

// Hook to automatically update overlay when bounding box changes
export const useBoundingBoxOverlay = (
  boundingBox: BoundingBox | null,
  isVisible: boolean,
  options: {
    color?: string
    thickness?: number
    opacity?: number
  } = {}
) => {
  const [overlayElement, setOverlayElement] = createSignal<HTMLDivElement | null>(null)

  const updateOverlay = () => {
    const overlay = overlayElement()
    const box = boundingBox
    
    if (!overlay || !box || !isVisible) {
      if (overlay) {
        overlay.style.display = 'none'
      }
      return
    }

    const color = options.color || '#3b82f6'
    const thickness = options.thickness || 2
    const opacity = options.opacity || 0.8

    overlay.style.display = 'block'
    overlay.style.position = 'fixed'
    overlay.style.top = `${box.top}px`
    overlay.style.left = `${box.left}px`
    overlay.style.width = `${box.width}px`
    overlay.style.height = `${box.height}px`
    overlay.style.border = `${thickness}px solid ${color}`
    overlay.style.backgroundColor = 'transparent'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '9999'
    overlay.style.opacity = opacity.toString()
    overlay.style.boxSizing = 'border-box'
  }

  // Update overlay when bounding box or visibility changes
  createEffect(() => {
    updateOverlay()
  })

  return {
    overlayElement,
    setOverlayElement,
    updateOverlay
  }
} 