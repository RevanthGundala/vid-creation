export interface FrameExtractionResult {
  frames: ImageBitmap[]
  error?: string
}

export interface FrameExtractionOptions {
  maxFrames?: number
  frameInterval?: number // milliseconds between frames
  quality?: number // 0-1 for canvas quality
}

// Check if WebCodecs is supported
export const isWebCodecsSupported = (): boolean => {
  return 'MediaStreamTrackProcessor' in (window as any)
}

// Extract frames using WebCodecs API (modern browsers)
export const extractFramesWithWebCodecs = async (
  video: HTMLVideoElement,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> => {
  const { maxFrames = 30 } = options
  const frames: ImageBitmap[] = []
  
  try {
    await video.play()
    const stream = (video as any).captureStream()
    const [track] = stream.getVideoTracks()
    
    if (!track) {
      throw new Error('No video track found')
    }
    
    const processor = new (window as any).MediaStreamTrackProcessor({ track })
    const reader = processor.readable.getReader()
    
    return new Promise((resolve, reject) => {
      const readChunk = async () => {
        try {
          const { done, value } = await reader.read()
          
          if (value) {
            const bitmap = await createImageBitmap(value)
            frames.push(bitmap)
            value.close()
            
            if (frames.length >= maxFrames) {
              video.pause()
              reader.releaseLock()
              resolve({ frames })
              return
            }
          }
          
          if (!done) {
            readChunk()
          } else {
            video.pause()
            reader.releaseLock()
            resolve({ frames })
          }
        } catch (err) {
          video.pause()
          reader.releaseLock()
          reject(err)
        }
      }
      
      readChunk()
    })
  } catch (err) {
    video.pause()
    throw err
  }
}

// Extract frames using Canvas API (fallback for older browsers)
export const extractFramesWithCanvas = async (
  video: HTMLVideoElement,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> => {
  const { maxFrames = 30, frameInterval = 100, quality = 0.8 } = options
  const frames: ImageBitmap[] = []
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    let frameCount = 0
    let lastFrameTime = 0
    
    const extractFrame = () => {
      if (video.paused || video.ended || frameCount >= maxFrames) {
        video.pause()
        resolve({ frames })
        return
      }
      
      const currentTime = video.currentTime
      
      // Only extract frame if enough time has passed
      if (currentTime - lastFrameTime >= frameInterval / 1000) {
        try {
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert canvas to ImageBitmap (without unsupported options)
          createImageBitmap(canvas)
            .then(bitmap => {
              frames.push(bitmap)
              frameCount++
              lastFrameTime = currentTime
              
              // Continue extracting frames
              requestAnimationFrame(extractFrame)
            })
            .catch(err => {
              video.pause()
              reject(err)
            })
        } catch (err) {
          video.pause()
          reject(err)
        }
      } else {
        // Continue without extracting frame
        requestAnimationFrame(extractFrame)
      }
    }
    
    // Start extraction
    video.currentTime = 0
    video.play()
      .then(() => {
        extractFrame()
      })
      .catch(err => {
        reject(err)
      })
  })
}

// Main frame extraction function that tries WebCodecs first, then falls back to Canvas
export const extractVideoFrames = async (
  videoUrl: string,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    
    video.onloadedmetadata = async () => {
      try {
        // Try WebCodecs first if supported
        if (isWebCodecsSupported()) {
          try {
            const result = await extractFramesWithWebCodecs(video, options)
            resolve(result)
            return
          } catch (err) {
            console.log('WebCodecs failed, using canvas fallback:', err)
          }
        }
        
        // Fallback to canvas method
        const result = await extractFramesWithCanvas(video, options)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    
    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }
    
    video.src = videoUrl
  })
}

// Utility function to convert ImageBitmap to base64 data URL
export const frameToDataUrl = async (frame: ImageBitmap): Promise<string> => {
  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }
  
  ctx.drawImage(frame, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}

// Utility function to download frame as image
export const downloadFrame = async (frame: ImageBitmap, filename: string = 'frame.jpg') => {
  const dataUrl = await frameToDataUrl(frame)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
} 