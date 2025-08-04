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

// Loading animation component
function LoadingAnimation({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">{message}</p>
        <p className="text-gray-300 text-sm mt-2">This may take a few minutes...</p>
      </div>
    </div>
  )
}

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
  
  // Check if there are any jobs currently in progress
  const jobsInProgress = jobs.filter(job => 
    job.job_type === "Object" && 
    job.status === "processing"
  );
  
  const hasJobsInProgress = jobsInProgress.length > 0;
  const latestJobInProgress = jobsInProgress.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  
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
  
  const assetUrl = assetUrlData?.signed_url;
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
          console.log('All headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            console.log('✅ Asset URL is accessible!')
            
            // Check if it's a binary file by looking at content-type
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/octet-stream')) {
              console.log('✅ File appears to be binary data (likely a .splat file)');
            } else if (contentType && contentType.includes('application/json')) {
              console.log('⚠️ File appears to be JSON (might be metadata, not the actual 3D asset)');
            } else {
              console.log('⚠️ Unexpected content type:', contentType);
            }
            
            // Try to get the filename from the URL or headers
            const url = new URL(assetUrl);
            const pathParts = url.pathname.split('/');
            const filename = pathParts[pathParts.length - 1];
            console.log('Filename from URL:', filename);
            
            // Check if the URL has a file extension
            if (filename.includes('.')) {
              console.log('✅ URL has file extension:', filename.split('.').pop());
            } else {
              console.log('⚠️ URL has no file extension - this might cause issues');
            }
            
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

  // Add a function to inspect the file content
  const handleInspectFile = async () => {
    if (!assetUrl) {
      console.log('No asset URL to inspect');
      return;
    }

    try {
      console.log('🔍 Inspecting file content from:', assetUrl);
      const response = await fetch(assetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      // Try to read the first few bytes to determine file type
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('File size:', uint8Array.length, 'bytes');
      console.log('First 16 bytes:', Array.from(uint8Array.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Check for common file signatures
      const firstBytes = Array.from(uint8Array.slice(0, 8));
      
      if (firstBytes[0] === 0x7B) { // '{' character
        console.log('✅ File appears to be JSON (starts with {)');
        // Try to parse as JSON
        const text = new TextDecoder().decode(uint8Array);
        try {
          const json = JSON.parse(text);
          console.log('JSON structure:', Object.keys(json));
          console.log('JSON preview:', JSON.stringify(json, null, 2).substring(0, 500) + '...');
        } catch (e) {
          console.log('Not valid JSON');
        }
      } else if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B) { // PK (ZIP)
        console.log('✅ File appears to be a ZIP archive');
      } else if (firstBytes[0] === 0x1F && firstBytes[1] === 0x8B) { // GZIP
        console.log('✅ File appears to be GZIP compressed');
      } else if (firstBytes[0] === 0x73 && firstBytes[1] === 0x70 && firstBytes[2] === 0x6C && firstBytes[3] === 0x61 && firstBytes[4] === 0x74) { // "splat"
        console.log('✅ File appears to be a .splat file (starts with "splat")');
      } else {
        console.log('⚠️ Unknown file format - first bytes:', firstBytes.map(b => String.fromCharCode(b)).join(''));
      }
      
    } catch (error) {
      console.error('File inspection failed:', error);
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
      <div className="relative min-h-screen bg-[#282c34] text-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-red-400">Error: {error}</div>
        </div>
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            <ChatBox 
              onSubmit={handleSubmit} 
              errorMessage={`Project loading failed: ${error}`}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show project not found state
  if (!project) {
    return (
      <div className="relative min-h-screen bg-[#282c34] text-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-xl">Project not found</div>
        </div>
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            <ChatBox 
              onSubmit={handleSubmit} 
              errorMessage="Project not found. Please check the project ID or try creating a new project."
            />
          </div>
        </div>
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
                <div>Failed Object jobs: {jobs.filter(j => j.job_type === "Object" && j.status === "failed").length}</div>
                <div>Jobs in progress: {jobsInProgress.length}</div>
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
                {assetUrl && (
                  <button 
                    onClick={handleInspectFile}
                    className="mt-2 ml-2 px-2 py-1 bg-green-600 rounded text-xs"
                  >
                    Inspect File
                  </button>
                )}
                {assetUrl && (
                  <button 
                    onClick={() => {
                      console.log('🔍 Testing file format for:', assetUrl);
                      fetch(assetUrl)
                        .then(response => response.arrayBuffer())
                        .then(buffer => {
                          const uint8Array = new Uint8Array(buffer);
                          const firstBytes = Array.from(uint8Array.slice(0, 32));
                          console.log('First 32 bytes (hex):', firstBytes.map(b => b.toString(16).padStart(2, '0')).join(' '));
                          console.log('First 32 bytes (ASCII):', firstBytes.map(b => String.fromCharCode(b < 32 || b > 126 ? 46 : b)).join(''));
                          console.log('File size:', buffer.byteLength, 'bytes');
                        })
                        .catch(err => console.error('Error testing file:', err));
                    }}
                    className="mt-2 ml-2 px-2 py-1 bg-purple-600 rounded text-xs"
                  >
                    Test File Format
                  </button>
                )}
                {latestCompletedJob && (
                  <div className="mt-2 text-xs">
                    <div>Latest Job ID: {latestCompletedJob.job_id}</div>
                    <div>Job Status: {latestCompletedJob.status}</div>
                    <div>Completed: {latestCompletedJob.completed_at ? new Date(latestCompletedJob.completed_at).toLocaleString() : 'N/A'}</div>
                  </div>
                )}
                {latestJobInProgress && (
                  <div className="mt-2 text-xs text-yellow-300">
                    <div>Processing Job: {latestJobInProgress.job_id.slice(0, 8)}...</div>
                    <div>Started: {new Date(latestJobInProgress.created_at).toLocaleString()}</div>
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
              
              {/* Loading animation for jobs in progress */}
              {hasJobsInProgress && (
                <LoadingAnimation 
                  message={`Generating 3D Asset... (Job ${latestJobInProgress?.job_id?.slice(0, 8)}...)`} 
                />
              )}
              
             <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
        <div className="pointer-events-auto">
          <ChatBox 
            onSubmit={handleSubmit} 
            errorMessage={
              hasCompletedJobButNoAsset 
                ? `Job ${latestCompletedJob?.job_id} completed but asset file is missing. Try generating a new 3D asset.`
                : assetLoadError 
                  ? `Asset loading failed: ${assetLoadError}`
                  : null
            }
          />
        </div>
      </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
    </>
  )
}