import { createFileRoute, Link } from '@tanstack/solid-router'
import { createEffect, createSignal } from 'solid-js'
import { GaussianSplat } from '../../../components/splat/GaussianSplat'

function fetchProject(projectId: string) {
  return {
    id: projectId,
    name: 'Project 1',
    description: 'Description 1',
  }
}

export const Route = createFileRoute('/_auth/projects/projects/$projectId')({
  loader: ({ params }) => fetchProject(params.projectId),
  component: ProjectComponent,
})

function ProjectComponent() {
  const params = Route.useParams()
  const [videoUrl, setVideoUrl] = createSignal<string | null>(
    `/api/projects/${params().projectId}`,
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
     <GaussianSplat />
    </div>
  )
} 