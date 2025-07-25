import { createFileRoute, Link, useParams } from '@tanstack/solid-router'

export const Route = createFileRoute('/_auth/create/$videoId')({
  component: CreateComponent,
})

function CreateComponent() {
  const { videoId } = useParams()
  const [videoUrl, setVideoUrl] = createSignal<string | null>(
    `/api/videos/${videoId}`,
  )
  let videoElement: HTMLVideoElement | undefined
  const [currentTime, setCurrentTime] = createSignal(0)
  const [videos, setVideos] = createSignal<string[]>([])

  // Sync currentTime signal with video element
  createEffect(() => {
    if (videoElement) {
      videoElement.currentTime = currentTime()
    }
  })

  return (
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <Link
        to="/login"
        class="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
      >
        Go to Authentication
      </Link>
      <Video videoUrl={videoUrl()} videoRef={el => (videoElement = el)} />
      <Toolbar videoUrl={videoUrl()} setVideoUrl={setVideoUrl} />
      <Timeline videoUrl={videoUrl()} setCurrentTime={setCurrentTime} />
      <ChatBox setVideos={setVideos} />
    </div>
  )
} 