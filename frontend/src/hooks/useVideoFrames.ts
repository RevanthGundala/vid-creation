import { useQuery } from '@tanstack/react-query'
import { extractVideoFrames, type FrameExtractionOptions, type FrameExtractionResult } from '../utils/videoFrameExtractor'

export interface UseVideoFramesOptions extends FrameExtractionOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number | boolean
  retryDelay?: number
}

export const useVideoFrames = (
  videoUrl: string | null,
  options: UseVideoFramesOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    cacheTime = 1000 * 60 * 10, // 10 minutes
    retry = 3,
    retryDelay = 1000,
    ...frameOptions
  } = options

  return useQuery({
    queryKey: ['video-frames', videoUrl, frameOptions],
    queryFn: async (): Promise<FrameExtractionResult> => {
      if (!videoUrl) {
        throw new Error('No video URL provided')
      }
      
      return await extractVideoFrames(videoUrl, frameOptions)
    },
    enabled: enabled && !!videoUrl,
    staleTime,
    gcTime: cacheTime, // TanStack Query v5 uses gcTime instead of cacheTime
    retry,
    retryDelay,
    throwOnError: true,
  })
}

// Hook for extracting frames with default settings
export const useVideoFramesDefault = (videoUrl: string | null) => {
  return useVideoFrames(videoUrl, {
    maxFrames: 30,
    frameInterval: 100,
    quality: 0.8,
  })
}

// Hook for high-quality frame extraction
export const useVideoFramesHighQuality = (videoUrl: string | null) => {
  return useVideoFrames(videoUrl, {
    maxFrames: 60,
    frameInterval: 50,
    quality: 1.0,
  })
}

// Hook for quick preview frames
export const useVideoFramesPreview = (videoUrl: string | null) => {
  return useVideoFrames(videoUrl, {
    maxFrames: 10,
    frameInterval: 200,
    quality: 0.6,
  })
} 