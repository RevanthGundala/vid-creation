import { createSignal, onCleanup } from 'solid-js'

interface TimelineProps {
  videoUrl: string | null
  setCurrentTime: (time: number) => void
}

export default function Timeline(props: TimelineProps) {
  let videoRef: HTMLVideoElement | undefined
  const [dragging, setDragging] = createSignal(false)
  const [progress, setProgress] = createSignal(0) // 0 to 1
  let duration = 0

  function handleMouseDown(e: MouseEvent) {
    setDragging(true)
    updateProgress(e)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (dragging()) {
      updateProgress(e)
    }
  }

  function handleMouseUp(e: MouseEvent) {
    setDragging(false)
    updateProgress(e)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  function updateProgress(e: MouseEvent) {
    const bar = document.getElementById('timeline-bar')
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(x, rect.width))
    const p = x / rect.width
    setProgress(p)
    if (duration > 0) {
      props.setCurrentTime(p * duration)
    }
  }

  function handleLoadedMetadata() {
    if (videoRef) {
      duration = videoRef.duration
    }
  }

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return (
    <div class="w-full max-w-4xl mt-6 flex flex-col items-center gap-2">
      {/* Small video preview */}
      <div class="flex justify-center w-full">
        <video
          ref={el => videoRef = el}
          src={props.videoUrl ?? ''}
          class="rounded shadow-md"
          style={{ width: '120px', height: '68px', objectFit: 'cover' }}
          muted
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
      {/* Timeline bar with draggable handle */}
      <div class="relative w-full h-8 flex items-center mt-2">
        <div
          id="timeline-bar"
          class="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          {/* Progress bar */}
          <div
            class="h-2 bg-blue-500 rounded-full"
            style={{ width: `${progress() * 100}%` }}
          />
          {/* Draggable handle as vertical rectangle */}
          <div
            class="absolute top-1/2 -translate-y-1/2"
            style={{ left: `calc(${progress() * 100}% - 2px)` }}
          >
            <div class="w-1 h-8 bg-blue-400 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}