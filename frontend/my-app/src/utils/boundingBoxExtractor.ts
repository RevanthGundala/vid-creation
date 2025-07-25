export interface BoundingBox {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
  x: number
  y: number
}

export interface BoundingBoxOptions {
  includePadding?: boolean
  includeMargin?: boolean
  relativeTo?: Element // Element to calculate position relative to
}

// Get bounding box of an element using getBoundingClientRect
export const getElementBoundingBox = (element: Element, options: BoundingBoxOptions = {}): BoundingBox => {
  const rect = element.getBoundingClientRect()
  const { relativeTo } = options
  
  let boundingBox: BoundingBox = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y
  }
  
  // If calculating relative to another element, adjust coordinates
  if (relativeTo) {
    const relativeRect = relativeTo.getBoundingClientRect()
    boundingBox = {
      top: boundingBox.top - relativeRect.top,
      right: boundingBox.right - relativeRect.left,
      bottom: boundingBox.bottom - relativeRect.top,
      left: boundingBox.left - relativeRect.left,
      width: boundingBox.width,
      height: boundingBox.height,
      x: boundingBox.x - relativeRect.left,
      y: boundingBox.y - relativeRect.top
    }
  }
  
  return boundingBox
}

// Get bounding box including padding
export const getElementBoundingBoxWithPadding = (element: Element, options: BoundingBoxOptions = {}): BoundingBox => {
  const rect = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)
  
  const paddingTop = parseFloat(styles.paddingTop) || 0
  const paddingRight = parseFloat(styles.paddingRight) || 0
  const paddingBottom = parseFloat(styles.paddingBottom) || 0
  const paddingLeft = parseFloat(styles.paddingLeft) || 0
  
  let boundingBox = getElementBoundingBox(element, options)
  
  boundingBox = {
    ...boundingBox,
    top: boundingBox.top - paddingTop,
    right: boundingBox.right + paddingRight,
    bottom: boundingBox.bottom + paddingBottom,
    left: boundingBox.left - paddingLeft,
    width: boundingBox.width + paddingLeft + paddingRight,
    height: boundingBox.height + paddingTop + paddingBottom
  }
  
  return boundingBox
}

// Get bounding box including margin
export const getElementBoundingBoxWithMargin = (element: Element, options: BoundingBoxOptions = {}): BoundingBox => {
  const rect = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)
  
  const marginTop = parseFloat(styles.marginTop) || 0
  const marginRight = parseFloat(styles.marginRight) || 0
  const marginBottom = parseFloat(styles.marginBottom) || 0
  const marginLeft = parseFloat(styles.marginLeft) || 0
  
  let boundingBox = getElementBoundingBox(element, options)
  
  boundingBox = {
    ...boundingBox,
    top: boundingBox.top - marginTop,
    right: boundingBox.right + marginRight,
    bottom: boundingBox.bottom + marginBottom,
    left: boundingBox.left - marginLeft,
    width: boundingBox.width + marginLeft + marginRight,
    height: boundingBox.height + marginTop + marginBottom
  }
  
  return boundingBox
}

// Get comprehensive bounding box with all options
export const getElementBoundingBoxComprehensive = (element: Element, options: BoundingBoxOptions = {}): BoundingBox => {
  const { includePadding = false, includeMargin = false } = options
  
  if (includeMargin) {
    return getElementBoundingBoxWithMargin(element, options)
  } else if (includePadding) {
    return getElementBoundingBoxWithPadding(element, options)
  } else {
    return getElementBoundingBox(element, options)
  }
}

// Get bounding box of element at specific coordinates
export const getElementAtPoint = (x: number, y: number): Element | null => {
  return document.elementFromPoint(x, y)
}

// Get bounding box of element under mouse cursor
export const getElementUnderCursor = (event: MouseEvent): { element: Element | null; boundingBox: BoundingBox | null } => {
  const element = document.elementFromPoint(event.clientX, event.clientY)
  
  if (!element) {
    return { element: null, boundingBox: null }
  }
  
  const boundingBox = getElementBoundingBox(element)
  return { element, boundingBox }
}

// Format bounding box for display
export const formatBoundingBox = (boundingBox: BoundingBox): string => {
  return `x: ${Math.round(boundingBox.x)}, y: ${Math.round(boundingBox.y)}, w: ${Math.round(boundingBox.width)}, h: ${Math.round(boundingBox.height)}`
}

// Check if a point is within a bounding box
export const isPointInBoundingBox = (point: { x: number; y: number }, boundingBox: BoundingBox): boolean => {
  return (
    point.x >= boundingBox.left &&
    point.x <= boundingBox.right &&
    point.y >= boundingBox.top &&
    point.y <= boundingBox.bottom
  )
}

// Get the intersection of two bounding boxes
export const getBoundingBoxIntersection = (box1: BoundingBox, box2: BoundingBox): BoundingBox | null => {
  const left = Math.max(box1.left, box2.left)
  const top = Math.max(box1.top, box2.top)
  const right = Math.min(box1.right, box2.right)
  const bottom = Math.min(box1.bottom, box2.bottom)
  
  if (left >= right || top >= bottom) {
    return null // No intersection
  }
  
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  }
} 