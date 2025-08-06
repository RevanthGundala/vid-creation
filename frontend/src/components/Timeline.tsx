
import { useState, useEffect, useRef } from 'react'
import { Button } from '../components/ui/button'

interface TimelineProps {
  videoUrls: string[]
  setCurrentTime: (time: number) => void
}

export default function Timeline(props: TimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0) // 0 to 1
  const [arrangeMode, setArrangeMode] = useState(false)
  const [currentVideoUrls, setCurrentVideoUrls] = useState(props.videoUrls)
  let duration = 0

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true)
    updateProgress(e.nativeEvent)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (dragging) {
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
    if (!videoRef.current) return
    const rect = videoRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(x, rect.width))
    const p = x / rect.width
    setProgress(p)
    if (duration > 0) {
      props.setCurrentTime(p * duration)
    }
  }

  function handleLoadedMetadata() {
    if (videoRef.current) {
      duration = videoRef.current.duration
    }
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer?.setData('text/plain', index.toString())
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault() // Necessary to allow dropping
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    const dragIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1')
    if (dragIndex === -1 || dragIndex === dropIndex) return

    const newUrls = [...currentVideoUrls]
    const [draggedItem] = newUrls.splice(dragIndex, 1)
    newUrls.splice(dropIndex, 0, draggedItem)
    setCurrentVideoUrls(newUrls)
  }

  return (
    <div className="w-full max-w-4xl mt-6 flex flex-col items-center gap-2">
      <Button onClick={() => setArrangeMode(!arrangeMode)}>
        {arrangeMode ? 'Done Arranging' : 'Arrange Videos'}
      </Button>

      {arrangeMode ? (
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {currentVideoUrls.map((url, index) => (
            <div
              key={index}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="relative rounded shadow-md cursor-grab"
              style={{ width: '120px', height: '68px', overflow: 'hidden' }}
            >
              <video
                src={url}
                className="w-full h-full object-cover rounded"
                muted
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="relative rounded shadow-md"
          style={{ width: '120px', height: '68px' }}
          onMouseDown={handleMouseDown}
        >
          <video
            ref={videoRef}
            src={props.videoUrls[0] ?? ''}
            className="w-full h-full object-cover rounded"
            muted
            onLoadedMetadata={handleLoadedMetadata}
          />
          {/* Draggable handle as vertical rectangle over video */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-blue-400 rounded cursor-grab"
            style={{ left: `calc(${progress * 100}% - 2px)` }}
          />
        </div>
      )}
    </div>
  )
}