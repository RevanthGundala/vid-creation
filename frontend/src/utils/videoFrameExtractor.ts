export interface FrameExtractionOptions {
  maxFrames?: number
  frameInterval?: number // milliseconds between frames
  quality?: number // 0.0 to 1.0
  startTime?: number // start time in seconds
  endTime?: number // end time in seconds
}

export interface FrameExtractionResult {
  frames: ImageBitmap[]
  metadata: {
    totalFrames: number
    duration: number
    frameRate: number
    extractedAt: number
  }
}

/**
 * Extracts frames from a video URL
 */
export async function extractVideoFrames(
  videoUrl: string,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> {
  const {
    maxFrames = 30,
    frameInterval = 100,
    quality = 0.8,
    startTime = 0,
    endTime
  } = options

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    const frames: ImageBitmap[] = []
    let currentTime = startTime
    let frameCount = 0

    video.onloadedmetadata = () => {
      const duration = endTime || video.duration
      const totalFrames = Math.min(maxFrames, Math.floor((duration - startTime) / (frameInterval / 1000)))
      
      if (totalFrames <= 0) {
        reject(new Error('No frames to extract'))
        return
      }

      video.currentTime = startTime
    }

    video.onseeked = async () => {
      try {
        // Create canvas to extract frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Set canvas size based on quality
        const scale = quality
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to ImageBitmap
        const imageBitmap = await createImageBitmap(canvas)
        frames.push(imageBitmap)
        frameCount++

        // Move to next frame
        currentTime += frameInterval / 1000

        if (frameCount < maxFrames && currentTime < (endTime || video.duration)) {
          video.currentTime = currentTime
        } else {
          // Extraction complete
          const result: FrameExtractionResult = {
            frames,
            metadata: {
              totalFrames: frames.length,
              duration: video.duration,
              frameRate: video.videoWidth > 0 ? frames.length / (currentTime - startTime) : 0,
              extractedAt: Date.now()
            }
          }
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = videoUrl
  })
}

/**
 * Downloads a frame as an image file
 */
export async function downloadFrame(frame: ImageBitmap, filename: string): Promise<void> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  canvas.width = frame.width
  canvas.height = frame.height
  ctx.drawImage(frame, 0, 0)

  // Convert to blob and download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Could not create blob')
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/jpeg', 0.9)
}

/**
 * Extracts a single frame at a specific time
 */
export async function extractFrameAtTime(
  videoUrl: string,
  time: number,
  quality: number = 0.8
): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      if (time >= video.duration) {
        reject(new Error('Time exceeds video duration'))
        return
      }
      video.currentTime = time
    }

    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        const scale = quality
        canvas.width = video.videoWidth * scale
        canvas.height = video.videoHeight * scale

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageBitmap = await createImageBitmap(canvas)
        resolve(imageBitmap)
      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = videoUrl
  })
}

/**
 * Gets video metadata without extracting frames
 */
export async function getVideoMetadata(videoUrl: string): Promise<{
  duration: number
  width: number
  height: number
  frameRate?: number
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        frameRate: video.videoWidth > 0 ? undefined : undefined // Browser doesn't expose frame rate
      })
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = videoUrl
  })
} 