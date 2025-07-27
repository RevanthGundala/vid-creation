import { useState, useEffect, useRef } from 'react'
import { useVideoFramesDefault, useVideoFramesHighQuality, useVideoFramesPreview } from '../hooks/useVideoFrames'
import { downloadFrame } from '../utils/videoFrameExtractor'
import { Button } from '../components/ui/button'

export interface VideoFrameExtractorProps {
  videoUrl: string | null
  onFrameSelect?: (frame: ImageBitmap) => void
  quality?: 'preview' | 'default' | 'high'
}

export default function VideoFrameExtractor(props: VideoFrameExtractorProps) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Use TanStack Query for frame extraction with caching
  const framesQuery = (() => {
    switch (props.quality) {
      case 'high':
        return useVideoFramesHighQuality(props.videoUrl)
      case 'preview':
        return useVideoFramesPreview(props.videoUrl)
      default:
        return useVideoFramesDefault(props.videoUrl)
    }
  })()

  // Handle frame selection
  const selectFrame = (index: number) => {
    setSelectedFrameIndex(index)
    const frames = framesQuery.data?.frames
    if (frames && frames[index] && props.onFrameSelect) {
      props.onFrameSelect(frames[index])
    }
  }

  // Draw selected frame to canvas
  const drawSelectedFrame = () => {
    const canvas = canvasRef.current
    const selectedIndex = selectedFrameIndex
    const frames = framesQuery.data?.frames
    
    if (canvas && selectedIndex !== null && frames) {
      const frame = frames[selectedIndex]
      if (frame) {
        canvas.width = frame.width
        canvas.height = frame.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(frame, 0, 0)
        }
      }
    }
  }

  // Handle frame download
  const handleDownloadFrame = async (index: number) => {
    const frames = framesQuery.data?.frames
    if (frames && frames[index]) {
      await downloadFrame(frames[index], `frame_${index}.jpg`)
    }
  }

  // Draw selected frame when selection changes
  useEffect(() => {
    if (selectedFrameIndex !== null) {
      drawSelectedFrame()
    }
  }, [selectedFrameIndex, framesQuery.data])

  return (
    <div className="flex flex-col gap-4">
      {/* Loading and Error States */}
      {framesQuery.isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Extracting frames...</p>
        </div>
      )}

      {framesQuery.isError && (
        <div className="text-center py-8 text-red-600">
          <p>Error: {framesQuery.error?.message || 'Failed to extract frames'}</p>
          <Button
            onClick={() => framesQuery.refetch()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Frame Grid */}
      {framesQuery.data?.frames && (
        <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
          {framesQuery.data.frames.map((frame: ImageBitmap, index: number) => (
            <div
              key={index}
              className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                selectedFrameIndex === index ? 'border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => selectFrame(index)}
            >
              <canvas
                width={frame.width}
                height={frame.height}
                className="w-full h-auto"
                style={{
                  maxWidth: '100px',
                  maxHeight: '60px',
                  objectFit: 'cover'
                }}
              />
              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                {index}
              </div>
              <Button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  handleDownloadFrame(index)
                }}
                className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded hover:bg-blue-600"
              >
                ↓
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Frame Display */}
      {selectedFrameIndex !== null && framesQuery.data?.frames && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Selected Frame</h3>
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded max-w-full"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleDownloadFrame(selectedFrameIndex!)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Download Frame
            </button>
            <button
              onClick={() => setSelectedFrameIndex(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Query Status Info */}
      {framesQuery.data && (
        <div className="text-sm text-gray-600 mt-2">
          <p>Extracted {framesQuery.data.frames.length} frames</p>
          <p>Cache status: {framesQuery.isStale ? 'Stale' : 'Fresh'}</p>
          <p>Last updated: {framesQuery.dataUpdatedAt ? new Date(framesQuery.dataUpdatedAt).toLocaleTimeString() : 'Unknown'}</p>
        </div>
      )}
    </div>
  )
} 