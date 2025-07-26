import { createSignal, createEffect, onCleanup, For } from 'solid-js'
import { useVideoFramesDefault, useVideoFramesHighQuality, useVideoFramesPreview } from '../hooks/useVideoFrames'
import { downloadFrame } from '../utils/videoFrameExtractor'

export interface VideoFrameExtractorProps {
  videoUrl: string | null
  onFrameSelect?: (frame: ImageBitmap) => void
  quality?: 'preview' | 'default' | 'high'
}

export default function VideoFrameExtractor(props: VideoFrameExtractorProps) {
  const [selectedFrameIndex, setSelectedFrameIndex] = createSignal<number | null>(null)
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement | null>(null)

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
    const canvas = canvasElement()
    const selectedIndex = selectedFrameIndex()
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

  // Cleanup on unmount
  onCleanup(() => {
    // TanStack Query handles cleanup automatically
  })

  // Draw selected frame when selection changes
  createEffect(() => {
    if (selectedFrameIndex() !== null) {
      drawSelectedFrame()
    }
  })

  return (
    <div class="flex flex-col gap-4">
      {/* Loading and Error States */}
      {framesQuery.isLoading && (
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-2 text-gray-600">Extracting frames...</p>
        </div>
      )}

      {framesQuery.isError && (
        <div class="text-center py-8 text-red-600">
          <p>Error: {framesQuery.error?.message || 'Failed to extract frames'}</p>
          <Button
            onClick={() => framesQuery.refetch()}
            class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Frame Grid */}
      {framesQuery.data?.frames && (
        <div class="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
          <For each={framesQuery.data.frames}>
            {(frame, index) => (
              <div
                class={`relative cursor-pointer border-2 rounded overflow-hidden ${
                  selectedFrameIndex() === index() ? 'border-blue-500' : 'border-gray-300'
                }`}
                onClick={() => selectFrame(index())}
              >
                <canvas
                  width={frame.width}
                  height={frame.height}
                  class="w-full h-auto"
                  style={{
                    'max-width': '100px',
                    'max-height': '60px',
                    'object-fit': 'cover'
                  }}
                />
                <div class="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {index()}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadFrame(index())
                  }}
                  class="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded hover:bg-blue-600"
                >
                  ↓
                </Button>
              </div>
            )}
          </For>
        </div>
      )}

      {/* Selected Frame Display */}
      {selectedFrameIndex() !== null && framesQuery.data?.frames && (
        <div class="mt-4">
          <h3 class="text-lg font-semibold mb-2">Selected Frame</h3>
          <canvas
            ref={setCanvasElement}
            class="border border-gray-300 rounded max-w-full"
          />
          <div class="mt-2 flex gap-2">
            <button
              onClick={() => handleDownloadFrame(selectedFrameIndex()!)}
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Download Frame
            </button>
            <button
              onClick={() => setSelectedFrameIndex(null)}
              class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Query Status Info */}
      {framesQuery.data && (
        <div class="text-sm text-gray-600 mt-2">
          <p>Extracted {framesQuery.data.frames.length} frames</p>
          <p>Cache status: {framesQuery.isStale ? 'Stale' : 'Fresh'}</p>
          <p>Last updated: {framesQuery.dataUpdatedAt ? new Date(framesQuery.dataUpdatedAt).toLocaleTimeString() : 'Unknown'}</p>
        </div>
      )}
    </div>
  )
} 