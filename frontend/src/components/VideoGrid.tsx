import React from 'react'

interface VideoGridProps {
  videos: Array<{
    id: string
    url?: string
    title?: string
  }>
  columns?: number
  isGenerating?: boolean
}

export function VideoGrid({ videos, columns = 3, isGenerating = false }: VideoGridProps) {
  return (
    <div className="w-full p-4">
      <div 
        className="grid gap-4 w-full"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: '300px'
        }}
      >
        {videos.map((video, index) => (
          <div key={video.id || index} className="relative bg-gray-100 rounded-lg overflow-hidden">
            {video.url ? (
              <div className="w-full h-full">
                <video
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  style={{ maxHeight: '100%' }}
                >
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {video.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-sm">
                    {video.title}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No video</p>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Loading placeholder when generating a new video */}
        {isGenerating && (
          <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-blue-300">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-600 font-semibold">Generating Video...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a few minutes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 