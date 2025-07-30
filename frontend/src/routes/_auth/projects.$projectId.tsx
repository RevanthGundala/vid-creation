import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { use3dAsset } from '../../hooks'
import { toast } from 'sonner'
import { Editor } from '@/components/editor'
import ChatBox from '@/components/ChatBox'

type Project = {
  id: string
  name: string
}

// TODO: Replace with actual API call
function fetchProject(projectId: string) {
  return {
    id: projectId,
    name: 'Project 1',
  }
}

export const Route = createFileRoute('/_auth/projects/$projectId')({
  loader: ({ params }) => fetchProject(params.projectId),
  component: ProjectComponent,
})

function ProjectComponent() {
  const params = Route.useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [asset, setAsset] = useState<any | null>(null)

  const { generate3dAsset } = use3dAsset({
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })
  
  useEffect(() => {
    const project = fetchProject(params.projectId)
    setProject(project)
  }, [params.projectId])

  const handleSubmit = (prompt: string) => {
    generate3dAsset({ prompt })
  }

  return (
    <div className="relative min-h-screen bg-[#282c34] text-white">
      {/* Editor takes full screen */}
      <Editor />
      
      {/* ChatBox positioned as overlay */}
      <div className="absolute bottom-36 left-0 right-0 flex justify-center z-50">
        <ChatBox onSubmit={handleSubmit} />
      </div>
    </div>
  )
}