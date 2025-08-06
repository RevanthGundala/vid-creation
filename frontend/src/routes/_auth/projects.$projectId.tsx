import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useVideo, useProject, $api } from '../../hooks'
import { toast } from 'sonner'
import { Editor } from '@/components/editor'
import ChatBox from '@/components/ChatBox'

import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/_auth/projects/$projectId')({
  component: ProjectComponent,
})

function ProjectComponent() {
  const params = Route.useParams()
  const queryClient = useQueryClient()
  const [lastJobCount, setLastJobCount] = useState(0)

  // Use the useProject hook instead of local state and fetchProject
  const { error, jobs, refetch } = useProject(params.projectId, {
    onSuccess: () => {
      // Project loaded successfully
    },
    onError: (error: string) => {
      toast.error(`Failed to load project: ${error}`)
    }
  })

  // Enhanced polling logic that continues for a short time after jobs complete
  useEffect(() => {
    const currentJobCount = jobs.length
    const hasIncompleteJobs = jobs.some(job => 
      (job.job_type === "Object" || job.job_type === "Video") && 
      job.status !== "completed" && 
      job.status !== "failed"
    );
    
    // Check if any jobs just completed
    const hasNewlyCompletedJobs = jobs.some(job => 
      (job.job_type === "Object" || job.job_type === "Video") && 
      job.status === "completed"
    );
    
    // If job count changed, we have incomplete jobs, or we have newly completed jobs, continue polling
    const shouldPoll = hasIncompleteJobs || currentJobCount !== lastJobCount || hasNewlyCompletedJobs
    
    if (shouldPoll) {
      setLastJobCount(currentJobCount)
      
      const interval = setInterval(() => {
        refetch()
        
        // Invalidate jobs query
        queryClient.invalidateQueries({
          queryKey: ['get', '/api/jobs']
        })
        
        // Invalidate asset URL queries for completed jobs
        jobs.forEach(job => {
          if (job.status === "completed") {
            queryClient.invalidateQueries({
              queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: job.job_id } } }]
            })
          }
        })
      }, 3000); // Poll every 3 seconds for faster updates

      // If we have newly completed jobs, continue polling for a bit longer to ensure UI updates
      if (hasNewlyCompletedJobs) {
        const completionTimeout = setTimeout(() => {
          // Force one more refetch after a delay to ensure we get the latest data
          refetch()
          queryClient.invalidateQueries({
            queryKey: ['get', '/api/jobs']
          })
          jobs.forEach(job => {
            if (job.status === "completed") {
              queryClient.invalidateQueries({
                queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: job.job_id } } }]
              })
            }
          })
        }, 2000); // Wait 2 seconds after completion

        return () => {
          clearInterval(interval);
          clearTimeout(completionTimeout);
        };
      }

      return () => clearInterval(interval);
    }
  }, [jobs, refetch, queryClient, lastJobCount]);

  // Webhook-based real-time updates for all jobs in the project
  useEffect(() => {
    if (!jobs.length) return;

    // Find jobs that are in progress and need webhook monitoring
    const jobsToMonitor = jobs.filter(job => 
      (job.job_type === "Object" || job.job_type === "Video") && 
      job.status === "processing"
    );

    if (!jobsToMonitor.length) return;

    const eventSources: EventSource[] = [];

    // Set up webhook connections for each job in progress
    jobsToMonitor.forEach(job => {
      try {
        const webhookUrl = `${import.meta.env.VITE_API_URL}/api/webhooks/${job.job_id}/stream`;
        const eventSource = new EventSource(webhookUrl);
        
        eventSource.onopen = () => {
          console.log(`Webhook connected for job ${job.job_id}`);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Webhook message received for job:', job.job_id, data);
            
            // Update job status in cache
            queryClient.setQueryData(
              ['get', '/api/jobs/{job_id}', { params: { path: { job_id: job.job_id } } }],
              data
            );
            
            // If job completed, invalidate related queries and refetch project data
            if (data.status === "completed") {
              queryClient.invalidateQueries({
                queryKey: ['get', '/api/jobs']
              });
              queryClient.invalidateQueries({
                queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: job.job_id } } }]
              });
              
              // Refetch project data to get updated job list
              setTimeout(() => {
                refetch();
              }, 500);
            }
          } catch (parseError) {
            console.error('Failed to parse webhook message:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error(`Webhook error for job ${job.job_id}:`, error);
          eventSource.close();
        };

        eventSources.push(eventSource);
      } catch (error) {
        console.error('Failed to connect to webhook for job:', job.job_id, error);
      }
    });

    // Cleanup function
    return () => {
      eventSources.forEach(eventSource => {
        eventSource.close();
      });
    };
  }, [jobs, queryClient, refetch]);

  // Find the latest completed 3D asset job
  const latestCompletedJob = jobs
    .filter(job => job.job_type === "Object" && job.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  
  // Use the correct API endpoint to get the asset URL
  const { data: assetUrlData } = $api.useQuery(
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
      onSuccess: () => {
        // Asset URL API call successful
      },
      onError: () => {
        // Asset URL API call failed
      }
    }
  );

  // Get all completed video jobs
  const completedVideoJobs = jobs
    .filter(job => job.job_type === "Video" && job.status === "completed")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Create videos array for the grid - show ALL completed video jobs
  const videos = completedVideoJobs.map(job => {
    // Extract signed_url from job result, ensuring it's a string
    let videoUrl: string | undefined = undefined;
    if (job.result && typeof job.result === 'object' && 'signed_url' in job.result) {
      const signedUrl = job.result.signed_url;
      if (typeof signedUrl === 'string') {
        videoUrl = signedUrl;
      }
    }
    
    return {
      id: job.job_id,
      url: videoUrl,
      title: `Video ${job.job_id.slice(0, 8)}...`,
    };
  });

  // For jobs that don't have URLs in their result, we'll need to fetch them
  // But for now, let's use what we have from the jobs data
  const videosWithUrls = videos;
  
  const assetUrl = assetUrlData?.signed_url;

  // Check specifically for video jobs in progress
  const videoJobsInProgress = jobs.filter(job => 
    job.job_type === "Video" && 
    job.status === "processing"
  );
  
  const hasVideoJobsInProgress = videoJobsInProgress.length > 0;



  const { generateVideo } = useVideo({
    onSuccess: () => {
      // Refetch jobs after starting generation to get the new job
      setTimeout(() => refetch(), 1000)
    },
    onError: () => {
      // Video generation error handled silently
    }
  })

  // Use project jobs as the single source of truth for loading states
  const isGenerating = hasVideoJobsInProgress;

  console.log('🎬 Project detail debug:', {
    isGenerating,
    hasVideoJobsInProgress,
    videoJobsInProgress: videoJobsInProgress.map(job => ({ id: job.job_id, status: job.status })),
    allJobs: jobs.map(job => ({ id: job.job_id, type: job.job_type, status: job.status }))
  });

  const handleSubmit = (prompt: string) => {
    generateVideo({ prompt, project_id: params.projectId })
  }

  // Mock project data for now
  const project = {
    name: `Project ${params.projectId}`,
    project_id: params.projectId
  };

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
      <div className="relative min-h-screen bg-white text-black">
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
      <div className="relative min-h-screen bg-white text-black">
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
     <div className="[--header-height:calc(--spacing(14))] h-screen">
      <SidebarProvider className="flex flex-col h-full">
        <SiteHeader title={project.name} />
        <div className="flex flex-1 min-h-0">
          {/* <AppSidebar /> */}
          <SidebarInset className="flex-1 overflow-y-auto">
            <div className="w-full">
              <Editor assetUrl={assetUrl} videos={videosWithUrls} isGenerating={!!isGenerating} />
              
              {/* Remove the duplicate loading animation since we're using isGenerating in the video grid */}
              
             <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
        <div className="pointer-events-auto">
          <ChatBox 
            onSubmit={handleSubmit} 
            errorMessage={
              hasCompletedJobButNoAsset 
                ? `Job ${latestCompletedJob?.job_id} completed but asset file is missing. Try generating a new 3D asset.`
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