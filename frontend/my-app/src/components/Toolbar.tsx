import { createSignal } from 'solid-js'
import VideoFrameExtractor from './VideoFrameExtractor'
import { Button } from '../components/ui/button'

export interface ToolbarProps {
  videoUrl: string | null
  setVideoUrl: (url: string | null) => void
}

enum Tool {
    DEFAULT = 'default',
    DRAW = 'draw',
    SELECT = 'select'
}

export default function Toolbar(props: ToolbarProps) {
  let videoRef: HTMLVideoElement | undefined

  const [activeTool, setActiveTool] = createSignal<Tool>(Tool.DEFAULT)
  const [selectedFrame, setSelectedFrame] = createSignal<ImageBitmap | null>(null)

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file && file.type === 'video/mp4') {
      const url = URL.createObjectURL(file)
      props.setVideoUrl(url)
    } else {
      props.setVideoUrl(null)
    }
  }

  const handleFrameSelect = (frame: ImageBitmap) => {
    setSelectedFrame(frame)
  }

  return (
    <div class="w-full max-w-4xl">
      {/* Toolbar */}
      <div class="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-md">
        <Button
          onClick={() => setActiveTool(Tool.DEFAULT)}
          class={`px-4 py-2 rounded ${activeTool() === Tool.DEFAULT ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          Default
        </Button>
        <Button
          onClick={() => setActiveTool(Tool.DRAW)}
          class={`px-4 py-2 rounded ${activeTool() === Tool.DRAW ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          Draw
        </Button>
        <Button
          onClick={() => setActiveTool(Tool.SELECT)}
          class={`px-4 py-2 rounded ${activeTool() === Tool.SELECT ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          Select 👆
        </Button>
        <div class="ml-auto">
          <label class="text-sm font-semibold mr-2">Upload MP4:</label>
          <input
            type="file"
            accept="video/mp4"
            class="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Video Frame Extractor */}
      {/* <VideoFrameExtractor videoUrl={props.videoUrl} /> */}
    </div>
  )
} 