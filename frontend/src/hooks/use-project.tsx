
import { $api } from ".";
import type { components } from "../types/api";

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
    name: "3D City Builder",
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

  // For now, we'll use a mock implementation since there's no direct project endpoint
  // In the future, when a project endpoint is added, this can be replaced with:
  // const { data: project, error, isLoading } = $api.useQuery("get", "/api/projects/{project_id}", {
  //   params: { path: { project_id: projectId } },
  //   enabled: enabled && !!projectId,
  // });

  const mockFetchProject = async (id: string): Promise<Project> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const project = mockProjects[id];
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    
    return project;
  };

  // Use the project jobs endpoint to get project information indirectly
  const { data: projectJobs, error: jobsError, isLoading: isJobsLoading } = $api.useQuery(
    "get", 
    "/api/projects/{project_id}/jobs",
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
    refetch: () => {
      // In a real implementation, this would refetch the project data
      // For now, we'll just return the mock data
      return Promise.resolve(project);
    },
  };
}