import { useState, useEffect, useRef } from 'react'
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

  const [state, setState] = useState<BoundingBoxState>({
    element: null,
    boundingBox: null,
    isHovering: false
  })

  const throttleTimeoutRef = useRef<number | null>(null)
  const lastMouseEventRef = useRef<MouseEvent | null>(null)
  const isListeningRef = useRef(false)

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

    lastMouseEventRef.current = event

    if (throttleTimeoutRef.current) return

    throttleTimeoutRef.current = window.setTimeout(() => {
      if (!lastMouseEventRef.current) return

      const { element, boundingBox } = getElementUnderCursor(lastMouseEventRef.current)
      
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
      
      throttleTimeoutRef.current = null
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
    if (isListeningRef.current) return
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    isListeningRef.current = true
  }

  const removeListeners = () => {
    if (!isListeningRef.current) return
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseleave', handleMouseLeave)
    isListeningRef.current = false
  }

  // Start listening when enabled
  useEffect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled
    if (isEnabled) {
      addListeners()
    } else {
      removeListeners()
    }

    return () => {
      removeListeners()
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeListeners()
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    addListeners,
    removeListeners
  }
}

// Hook for getting bounding box of a specific element
export const useElementBoundingBox = (
  element: Element | null,
  options: UseBoundingBoxExtractorOptions = {}
) => {
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null)

  const updateBoundingBox = () => {
    if (!element) {
      setBoundingBox(null)
      return
    }

    const boundingBoxOptions: BoundingBoxOptions = {
      includePadding: options.includePadding || false,
      includeMargin: options.includeMargin || false,
      relativeTo: options.container || options.relativeTo
    }

    const box = getElementBoundingBox(element, boundingBoxOptions)
    setBoundingBox(box)
  }

  useEffect(() => {
    if (!element) return

    const handleResize = () => updateBoundingBox()
    const handleScroll = () => updateBoundingBox()

    // Initial calculation
    updateBoundingBox()

    // Listen for changes
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    // Use ResizeObserver for element size changes
    const resizeObserver = new ResizeObserver(() => updateBoundingBox())
    resizeObserver.observe(element)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
      resizeObserver.disconnect()
    }
  }, [element, options.includePadding, options.includeMargin, options.container, options.relativeTo])

  return boundingBox
} 