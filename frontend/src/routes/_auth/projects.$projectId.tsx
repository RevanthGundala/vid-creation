import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { use3dAsset, useProject } from '../../hooks'
import { toast } from 'sonner'
import { Editor } from '@/components/editor'
import ChatBox from '@/components/ChatBox'
import type { Project } from '../../hooks/use-project'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const Route = createFileRoute('/_auth/projects/$projectId')({
  component: ProjectComponent,
})

function ProjectComponent() {
  const params = Route.useParams()
  const [prompt, setPrompt] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [asset, setAsset] = useState<any | null>(null)

  // Use the useProject hook instead of local state and fetchProject
  const { project, error, isLoading, jobs } = useProject(params.projectId, {
    onSuccess: (project: Project) => {
      console.log('Project loaded:', project)
    },
    onError: (error: string) => {
      console.error('Failed to load project:', error)
      toast.error(`Failed to load project: ${error}`)
    }
  })

  const { generate3dAsset } = use3dAsset({
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })
  
  // Find the latest completed 3D asset job
  const latestCompletedJob = jobs
    .filter(job => job.job_type === "Object" && job.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  // Generate asset URL for the latest completed job (using public endpoint for development)
  const assetUrl = latestCompletedJob ? `/api/assets/public/${latestCompletedJob.job_id}` : undefined;
  
  // Debug logging
  console.log('Jobs:', jobs);
  console.log('Latest completed job:', latestCompletedJob);
  console.log('Asset URL:', assetUrl);
  
  // Test the asset URL if it exists
  useEffect(() => {
    if (assetUrl) {
      console.log('Testing asset URL:', assetUrl);
      fetch(assetUrl)
        .then(response => {
          console.log('Asset URL test response:', response.status, response.statusText);
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Length:', response.headers.get('content-length'));
        })
        .catch(error => {
          console.error('Asset URL test error:', error);
        });
    }
  }, [assetUrl]);

  const handleSubmit = (prompt: string) => {
    generate3dAsset({ prompt, project_id: params.projectId })
  }

  // Show loading state
  // if (isLoading) {
  //   return (
  //     <div className="relative min-h-screen bg-[#282c34] text-white flex items-center justify-center">
  //       <div className="text-xl">Loading project...</div>
  //     </div>
  //   )
  // }

  // Show error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-[#282c34] text-white flex items-center justify-center">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    )
  }

  // Show project not found state
  if (!project) {
    return (
      <div className="relative min-h-screen bg-[#282c34] text-white flex items-center justify-center">
        <div className="text-xl">Project not found</div>
      </div>
    )
  }

  return (
    <>
     <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader title={project.name} />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col relative">
              <Editor assetUrl={assetUrl} />
             <div className="absolute bottom-36 left-0 right-0 flex justify-center z-50">
        <ChatBox onSubmit={handleSubmit} />
      </div> 
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
    </>
  )
}