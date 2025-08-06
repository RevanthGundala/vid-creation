export interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

export interface BoundingBoxOptions {
  includePadding?: boolean
  includeMargin?: boolean
  relativeTo?: Element | null
}

/**
 * Gets the element under the cursor at the given mouse event position
 */
export function getElementUnderCursor(event: MouseEvent): { element: Element | null; boundingBox: BoundingBox | null } {
  const element = document.elementFromPoint(event.clientX, event.clientY)
  
  if (!element) {
    return { element: null, boundingBox: null }
  }

  const rect = element.getBoundingClientRect()
  const boundingBox: BoundingBox = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  }

  return { element, boundingBox }
}

/**
 * Gets the comprehensive bounding box of an element with optional padding and margin
 */
export function getElementBoundingBox(element: Element, options: BoundingBoxOptions = {}): BoundingBox {
  const { includePadding = false, includeMargin = false, relativeTo = null } = options
  
  const rect = element.getBoundingClientRect()
  const styles = window.getComputedStyle(element)
  
  let top = rect.top
  let left = rect.left
  let width = rect.width
  let height = rect.height
  
  // Include padding if requested
  if (includePadding) {
    const paddingTop = parseFloat(styles.paddingTop) || 0
    const paddingLeft = parseFloat(styles.paddingLeft) || 0
    const paddingRight = parseFloat(styles.paddingRight) || 0
    const paddingBottom = parseFloat(styles.paddingBottom) || 0
    
    top -= paddingTop
    left -= paddingLeft
    width += paddingLeft + paddingRight
    height += paddingTop + paddingBottom
  }
  
  // Include margin if requested
  if (includeMargin) {
    const marginTop = parseFloat(styles.marginTop) || 0
    const marginLeft = parseFloat(styles.marginLeft) || 0
    const marginRight = parseFloat(styles.marginRight) || 0
    const marginBottom = parseFloat(styles.marginBottom) || 0
    
    top -= marginTop
    left -= marginLeft
    width += marginLeft + marginRight
    height += marginTop + marginBottom
  }
  
  // Adjust relative to another element if specified
  if (relativeTo) {
    const relativeRect = relativeTo.getBoundingClientRect()
    top -= relativeRect.top
    left -= relativeRect.left
  }
  
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height
  }
}

/**
 * Checks if a point is within a bounding box
 */
export function isPointInBoundingBox(point: { x: number; y: number }, box: BoundingBox): boolean {
  return point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom
}

/**
 * Gets the intersection of two bounding boxes
 */
export function getBoundingBoxIntersection(box1: BoundingBox, box2: BoundingBox): BoundingBox | null {
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
    width: right - left,
    height: bottom - top,
    right,
    bottom
  }
}

/**
 * Gets the union of two bounding boxes
 */
export function getBoundingBoxUnion(box1: BoundingBox, box2: BoundingBox): BoundingBox {
  const left = Math.min(box1.left, box2.left)
  const top = Math.min(box1.top, box2.top)
  const right = Math.max(box1.right, box2.right)
  const bottom = Math.max(box1.bottom, box2.bottom)
  
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    right,
    bottom
  }
} 