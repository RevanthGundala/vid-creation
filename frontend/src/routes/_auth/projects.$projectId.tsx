import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { use3dAsset, useProject, $api } from '../../hooks'
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
  const [assetLoadError, setAssetLoadError] = useState<string | null>(null)
  const [isRetryingAsset, setIsRetryingAsset] = useState(false)

  // Use the useProject hook instead of local state and fetchProject
  const { project, error, isLoading, jobs, refetch } = useProject(params.projectId, {
    onSuccess: (project: Project) => {
      console.log('Project loaded:', project)
    },
    onError: (error: string) => {
      console.error('Failed to load project:', error)
      toast.error(`Failed to load project: ${error}`)
    }
  })

  // Add polling to automatically refresh jobs
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if there are jobs that are not completed
      const hasIncompleteJobs = jobs.some(job => 
        job.job_type === "Object" && 
        job.status !== "completed" && 
        job.status !== "failed"
      );
      
      if (hasIncompleteJobs) {
        console.log('Polling: Refreshing jobs due to incomplete jobs');
        refetch();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [jobs, refetch]);

  const { generate3dAsset } = use3dAsset({
    onSuccess: (data) => {
      console.log('3D asset generation started:', data)
      // Refetch jobs after starting generation to get the new job
      setTimeout(() => refetch(), 1000)
    },
    onError: (error) => {
      console.error('3D asset generation error:', error)
    }
  })
  
  // Enhanced debugging for jobs
  console.log('=== JOB DEBUGGING ===')
  console.log('All jobs:', jobs)
  console.log('Jobs count:', jobs.length)
  
  // Log each job with its details
  jobs.forEach((job, index) => {
    console.log(`Job ${index}:`, {
      job_id: job.job_id,
      job_type: job.job_type,
      status: job.status,
      created_at: job.created_at,
      completed_at: job.completed_at,
      result: job.result
    })
  })
  
  // Find the latest completed 3D asset job
  const latestCompletedJob = jobs
    .filter(job => job.job_type === "Object" && job.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  console.log('Latest completed Object job:', latestCompletedJob)
  
  // Use the correct API endpoint to get the asset URL
  const { data: assetUrlData, error: assetUrlError } = $api.useQuery(
    "get",
    "/api/jobs/{job_id}/asset-url",
    {
      params: {
        path: { job_id: latestCompletedJob?.job_id || "" },
      },
    },
    {
      enabled: !!latestCompletedJob?.job_id,
      staleTime: 0, // Always fetch fresh data
      onSuccess: (data: any) => {
        console.log('✅ Asset URL API call successful:', data);
        console.log('Full API response:', JSON.stringify(data, null, 2));
      },
      onError: (error: any) => {
        console.error('❌ Asset URL API call failed:', error);
      }
    }
  );
  
  // Use signed URL if available, otherwise use a direct GCS URL for the example file
  // TEMPORARY: Proxy through backend to avoid CORS issues
  const assetUrl = assetUrlData?.signed_url ? 
    `${import.meta.env.VITE_API_URL}/api/proxy-asset?url=${encodeURIComponent(assetUrlData.signed_url)}` :
    (assetUrlData?.storage_path?.includes('example') ? 
      'https://storage.googleapis.com/vid-creation-backend-storage/assets/ksplat/example.ksplat' : 
      undefined);
  
  console.log('Asset URL data:', assetUrlData)
  console.log('Asset URL error:', assetUrlError)
  console.log('Asset URL:', assetUrl)
  if (assetUrlData?.signed_url) {
    console.log('✅ Signed URL from API:', assetUrlData.signed_url)
  } else {
    console.log('❌ No signed URL from API')
  }
  if (assetUrlData?.storage_path) {
    console.log('Storage path from API:', assetUrlData.storage_path)
    console.log('Constructed storage URL:', `${import.meta.env.VITE_API_URL}/api/${assetUrlData.storage_path}`)
    console.log('Alternative URL (without /api/):', `${import.meta.env.VITE_API_URL}/${assetUrlData.storage_path}`)
  }
  
  // Test the asset URL if it exists
  useEffect(() => {
    setAssetLoadError(null); // Reset error state when testing new URL
    
    if (assetUrl) {
      console.log('Testing asset URL:', assetUrl);
      fetch(assetUrl)
        .then(response => {
          console.log('Asset URL test response:', response.status, response.statusText);
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Length:', response.headers.get('content-length'));
          
          if (response.ok) {
            console.log('✅ Asset URL is accessible!')
          } else {
            console.error('❌ Asset URL returned error status:', response.status)
            setAssetLoadError(`Asset file not accessible (${response.status})`);
            // If the signed URL fails, log the error but don't try fallback
            console.log('Signed URL failed, no fallback available');
          }
        })
        .catch(error => {
          console.error('Asset URL test error:', error);
          setAssetLoadError(`Network error: ${error.message}`);
        });
    } else {
      console.log('No signed URL available - no completed Object jobs found or no signed URL generated')
    }
  }, [assetUrl, assetUrlData]);

  // Add a manual refresh button for debugging
  const handleRefresh = () => {
    console.log('Manual refresh triggered')
    refetch()
  }

  // Add a function to retry asset URL fetching
  const handleRetryAsset = async () => {
    if (!latestCompletedJob?.job_id) {
      console.log('No completed job to retry asset for');
      return;
    }

    setIsRetryingAsset(true);
    setAssetLoadError(null);
    
    try {
      console.log('Retrying asset URL fetch for job:', latestCompletedJob.job_id);
      
      // Manually trigger the asset URL query
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${latestCompletedJob.job_id}/asset-url`);
      const data = await response.json();
      
      if (response.ok && data.signed_url) {
        console.log('✅ Asset URL retry successful:', data.signed_url);
        // Test the new URL
        const assetResponse = await fetch(data.signed_url);
        if (assetResponse.ok) {
          console.log('✅ Asset file is now accessible!');
          // Force a refetch of the asset URL data
          refetch();
        } else {
          throw new Error(`Asset file still not accessible: ${assetResponse.status}`);
        }
      } else {
        throw new Error(`Asset URL API returned error: ${response.status}`);
      }
    } catch (error) {
      console.error('Asset retry failed:', error);
      setAssetLoadError(error instanceof Error ? error.message : 'Failed to load asset');
    } finally {
      setIsRetryingAsset(false);
    }
  };

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

  // Check if we have a completed job but no asset URL
  const hasCompletedJobButNoAsset = latestCompletedJob && !assetUrl;

  return (
    <>
     <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader title={project.name} />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col relative">
              {/* Debug info */}
              <div className="absolute top-4 right-4 z-50 bg-black/80 text-white p-4 rounded text-sm">
                <div>Jobs: {jobs.length}</div>
                <div>Completed Object jobs: {jobs.filter(j => j.job_type === "Object" && j.status === "completed").length}</div>
                <div>Asset URL: {assetUrl ? '✅' : '❌'}</div>
                {assetLoadError && (
                  <div className="text-red-400 text-xs mt-1">Asset Error: {assetLoadError}</div>
                )}
                <button 
                  onClick={handleRefresh}
                  className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
                >
                  Refresh Jobs
                </button>
                {latestCompletedJob && (
                  <div className="mt-2 text-xs">
                    <div>Latest Job ID: {latestCompletedJob.job_id}</div>
                    <div>Job Status: {latestCompletedJob.status}</div>
                    <div>Completed: {latestCompletedJob.completed_at ? new Date(latestCompletedJob.completed_at).toLocaleString() : 'N/A'}</div>
                  </div>
                )}
              </div>
              
              {/* Warning for completed job without asset */}
              {hasCompletedJobButNoAsset && (
                <div className="absolute top-20 left-4 right-4 z-50 bg-yellow-600/90 text-white p-4 rounded text-sm">
                  <div className="font-bold">⚠️ Asset Generation Issue</div>
                  <div>Job {latestCompletedJob.job_id} completed but asset file is missing.</div>
                  <div>This indicates a backend issue with the 3D asset generation pipeline.</div>
                  {assetLoadError && (
                    <div className="text-xs mt-2 text-red-200">
                      Error: {assetLoadError}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={handleRetryAsset}
                      disabled={isRetryingAsset}
                      className="px-3 py-1 bg-blue-600 rounded text-xs disabled:opacity-50"
                    >
                      {isRetryingAsset ? 'Retrying...' : 'Retry Asset'}
                    </button>
                    <button 
                      onClick={handleRefresh}
                      className="px-3 py-1 bg-gray-600 rounded text-xs"
                    >
                      Refresh Jobs
                    </button>
                  </div>
                  <div className="text-xs mt-2">Check backend logs for more details.</div>
                </div>
              )}
              
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