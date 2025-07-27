import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { useGenerate3dAsset } from '../../hooks/3d'
import { toast } from 'sonner'

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
  const { generate3dAsset, isGenerating, generate3dAssetError, generate3dAssetData } = useGenerate3dAsset({
    onSuccess: (asset: any) => {
      toast.success("3D asset generated successfully")
      setAsset(asset)
    },
    onError: (error: any) => { 
      toast.error(error.message || "Failed to generate 3D asset")
    }
  })
  useEffect(() => {
    const project = fetchProject(params.projectId)
    setProject(project)
  }, [params.projectId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <input type="text" placeholder="Prompt" value={prompt || ''} onChange={(e) => setPrompt(e.target.value || null)} />
      <input type="text" placeholder="Image URL" value={imageUrl || ''} onChange={(e) => setImageUrl(e.target.value || null )} />
      <button onClick={() => generate3dAsset({ prompt, imageUrl })}>Generate 3D Asset</button>
      {isGenerating && <p>Generating 3D asset...</p>}
      {generate3dAssetError && <p>Error: {generate3dAssetError}</p>}
      {generate3dAssetData && <p>3D asset generated successfully</p>}
      {asset && <p>3D asset generated successfully</p>}
    </div>
  )
} 