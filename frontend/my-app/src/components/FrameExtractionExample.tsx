import { createSignal } from 'solid-js'
import VideoFrameExtractor from './VideoFrameExtractor'

export default function FrameExtractionExample() {
  const [videoUrl, setVideoUrl] = createSignal<string | null>(null)
  const [selectedFrame, setSelectedFrame] = createSignal<ImageBitmap | null>(null)

  const handleFrameSelect = (frame: ImageBitmap) => {
    setSelectedFrame(frame)
    console.log('Selected frame:', frame.width, 'x', frame.height)
  }

  const loadSampleVideo = () => {
    // Using a sample video from Wikimedia Commons
    const sampleUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/a4/BBH_gravitational_lensing_of_gw150914.webm'
    setVideoUrl(sampleUrl)
  }

  return (
    <div class="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div class="text-center">
        <h1 class="text-3xl font-bold mb-4">Video Frame Extraction with WebCodecs</h1>
        <p class="text-gray-600 mb-6">
          This example demonstrates how to extract individual frames from a video using the WebCodecs API.
          <br />
          <strong>Note:</strong> This requires Chrome with experimental features enabled.
          <br />
          Go to <code class="bg-gray-100 px-2 py-1 rounded">chrome://flags/#enable-experimental-web-platform-features</code> and enable it.
        </p>
        
        <div class="flex gap-4 justify-center mb-6">
          <Button
            onClick={loadSampleVideo}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Load Sample Video
          </Button>
          
          <Button
            onClick={() => setVideoUrl(null)}
            class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Clear Video
          </Button>
        </div>
      </div>

      {videoUrl() ? (
        <VideoFrameExtractor 
          videoUrl={videoUrl()} 
          onFrameSelect={handleFrameSelect}
        />
      ) : (
        <div class="text-center py-12 bg-gray-100 rounded-lg">
          <p class="text-gray-600">Click "Load Sample Video" to start frame extraction</p>
        </div>
      )}

      {/* Instructions */}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ol class="list-decimal list-inside space-y-1 text-blue-700">
          <li>Load a video (sample or upload your own MP4)</li>
          <li>Click "Start Frame Extraction" to begin extracting frames</li>
          <li>Wait for frames to be extracted (this happens at video playback speed)</li>
          <li>Use the dropdown to select a specific frame</li>
          <li>The selected frame will be displayed in the preview canvas</li>
          <li>You can pause the video during selection for better control</li>
        </ol>
      </div>

      {/* Browser Support Info */}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 class="font-semibold text-yellow-800 mb-2">Browser Support:</h3>
        <ul class="list-disc list-inside space-y-1 text-yellow-700">
          <li><strong>Chrome/Edge:</strong> Enable experimental features flag</li>
          <li><strong>Firefox:</strong> Not yet supported</li>
          <li><strong>Safari:</strong> Not yet supported</li>
          <li><strong>Mobile browsers:</strong> Limited support</li>
        </ul>
      </div>
    </div>
  )
} 