import { createSignal, onCleanup, onMount, createEffect } from 'solid-js'
import { 
  getElementUnderCursor, 
  getElementBoundingBox, 
  type BoundingBox, 
  type BoundingBoxOptions 
} from '../utils/boundingBoxExtractor'

export interface UseBoundingBoxExtractorOptions {
  enabled?: boolean | (() => boolean)
  includePadding?: boolean
  includeMargin?: boolean
  relativeTo?: Element
  container?: Element | null // Container to scope the extraction to
  throttleMs?: number
}

export interface BoundingBoxState {
  element: Element | null
  boundingBox: BoundingBox | null
  isHovering: boolean
}

export const useBoundingBoxExtractor = (options: UseBoundingBoxExtractorOptions = {}) => {
  const {
    enabled = true,
    includePadding = false,
    includeMargin = false,
    relativeTo,
    container,
    throttleMs = 16 // ~60fps
  } = options

  const [state, setState] = createSignal<BoundingBoxState>({
    element: null,
    boundingBox: null,
    isHovering: false
  })

  let throttleTimeout: number | null = null
  let lastMouseEvent: MouseEvent | null = null
  let isListening = false

  const boundingBoxOptions: BoundingBoxOptions = {
    includePadding,
    includeMargin,
    relativeTo: container || relativeTo // Use container as relativeTo if provided
  }

  const handleMouseMove = (event: MouseEvent) => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled
    if (!isEnabled) return

    // If container is specified, check if mouse is within the container
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const mouseX = event.clientX
      const mouseY = event.clientY
      
      if (mouseX < containerRect.left || mouseX > containerRect.right || 
          mouseY < containerRect.top || mouseY > containerRect.bottom) {
        // Mouse is outside the container, clear state
        setState({
          element: null,
          boundingBox: null,
          isHovering: false
        })
        return
      }
    }

    lastMouseEvent = event

    if (throttleTimeout) return

    throttleTimeout = window.setTimeout(() => {
      if (!lastMouseEvent) return

      const { element, boundingBox } = getElementUnderCursor(lastMouseEvent)
      
      // If container is specified, only process elements within the container
      if (container && element) {
        if (!container.contains(element)) {
          setState({
            element: null,
            boundingBox: null,
            isHovering: false
          })
          return
        }
      }
      
      if (element && boundingBox) {
        // Get comprehensive bounding box with options
        const comprehensiveBoundingBox = getElementBoundingBox(element, boundingBoxOptions)
        console.log('comprehensiveBoundingBox', comprehensiveBoundingBox)
        
        setState({
          element,
          boundingBox: comprehensiveBoundingBox,
          isHovering: true
        })
      } else {
        setState({
          element: null,
          boundingBox: null,
          isHovering: false
        })
      }

      throttleTimeout = null
    }, throttleMs)
  }

  const handleMouseLeave = () => {
    setState({
      element: null,
      boundingBox: null,
      isHovering: false
    })
  }

  const addListeners = () => {
    if (!isListening) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseleave', handleMouseLeave)
      isListening = true
      console.log('Bounding box extractor listeners added')
    }
  }

  const removeListeners = () => {
    if (isListening) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      isListening = false
      console.log('Bounding box extractor listeners removed')
    }
  }

  // Reactive effect to handle enabled state changes
  createEffect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled
    console.log('Bounding box extractor enabled:', isEnabled)
    
    if (isEnabled) {
      addListeners()
    } else {
      removeListeners()
      // Clear state when disabled
      setState({
        element: null,
        boundingBox: null,
        isHovering: false
      })
    }
  })

  onCleanup(() => {
    removeListeners()
    
    if (throttleTimeout) {
      clearTimeout(throttleTimeout)
    }
  })

  return {
    state,
    isHovering: () => state().isHovering,
    element: () => state().element,
    boundingBox: () => state().boundingBox,
    // Helper to get formatted bounding box string
    formattedBoundingBox: () => {
      const box = state().boundingBox
      if (!box) return null
      return `x: ${Math.round(box.x)}, y: ${Math.round(box.y)}, w: ${Math.round(box.width)}, h: ${Math.round(box.height)}`
    }
  }
}

// Hook for specific element bounding box tracking
export const useElementBoundingBox = (
  element: Element | null,
  options: UseBoundingBoxExtractorOptions = {}
) => {
  const [boundingBox, setBoundingBox] = createSignal<BoundingBox | null>(null)

  const updateBoundingBox = () => {
    if (element) {
      const box = getElementBoundingBox(element, {
        includePadding: options.includePadding,
        includeMargin: options.includeMargin,
        relativeTo: options.relativeTo
      })
      setBoundingBox(box)
    } else {
      setBoundingBox(null)
    }
  }

  onMount(() => {
    updateBoundingBox()
    
    // Update on resize
    const handleResize = () => updateBoundingBox()
    window.addEventListener('resize', handleResize)
    
    // Update on scroll
    const handleScroll = () => updateBoundingBox()
    window.addEventListener('scroll', handleScroll)
    
    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    })
  })

  return {
    boundingBox,
    updateBoundingBox,
    formattedBoundingBox: () => {
      const box = boundingBox()
      if (!box) return null
      return `x: ${Math.round(box.x)}, y: ${Math.round(box.y)}, w: ${Math.round(box.width)}, h: ${Math.round(box.height)}`
    }
  }
} 