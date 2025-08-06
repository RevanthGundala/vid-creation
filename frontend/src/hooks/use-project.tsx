
import { $api } from ".";
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Project type based on the backend schema
export interface Project {
  project_id: string;
  user_id: string;
  name: string;
  created_at: string;
  modified_at: string;
}

// Hook options interface
interface UseProjectOptions {
  enabled?: boolean;
  onSuccess?: (project: Project) => void;
  onError?: (error: string) => void;
}

// Mock project data for now (since there's no direct project endpoint)
const mockProjects: Record<string, Project> = {
  "1": {
    project_id: "1",
    user_id: "user1",
    name: "Project 1",
    created_at: "2024-01-01T00:00:00Z",
    modified_at: "2024-01-01T00:00:00Z",
  },
  "2": {
    project_id: "2", 
    user_id: "user1",
    name: "Virtual Gallery",
    created_at: "2024-01-02T00:00:00Z",
    modified_at: "2024-01-02T00:00:00Z",
  },
  "3": {
    project_id: "3",
    user_id: "user1", 
    name: "Game Engine",
    created_at: "2024-01-03T00:00:00Z",
    modified_at: "2024-01-03T00:00:00Z",
  },
};

export function useProject(projectId: string, options: UseProjectOptions = {}) {
  const { enabled = true, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  // Use the project jobs endpoint to get project information indirectly
  const { data: projectJobs, error: jobsError, isLoading: isJobsLoading, refetch } = $api.useQuery(
    "get", 
    `/api/jobs`,
    {
      params: { path: { project_id: projectId } },
      enabled: enabled && !!projectId,
    }
  );

  // Mock project data for now
  const mockProject = mockProjects[projectId];
  
  // Combine real job data with mock project data
  const project: Project | undefined = mockProject ? {
    ...mockProject,
    // You could enhance this with real data from jobs if needed
  } : undefined;

  const isLoading = enabled && !!projectId && isJobsLoading;
  const error = jobsError?.detail?.[0]?.msg || (jobsError?.detail ? JSON.stringify(jobsError.detail) : null) || (enabled && !!projectId && !mockProject ? "Project not found" : null);

  // Enhanced refetch function that also invalidates related queries
  const enhancedRefetch = async () => {
    const result = await refetch();
    
    // Invalidate related queries to ensure fresh data
    if (projectJobs) {
      // Invalidate jobs query
      queryClient.invalidateQueries({
        queryKey: ['get', '/api/jobs']
      });
      
      // Invalidate asset URL queries for completed jobs
      projectJobs.forEach((job: any) => {
        if (job.status === "completed") {
          queryClient.invalidateQueries({
            queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: job.job_id } } }]
          });
        }
      });
    }
    
    return result;
  };

  // Call success/error callbacks
  if (project && onSuccess) {
    onSuccess(project);
  }
  
  if (error && onError) {
    onError(error);
  }

  return {
    project,
    error,
    isLoading,
    // Additional data from jobs if needed
    jobs: projectJobs || [],
    refetch: enhancedRefetch,
  };
}