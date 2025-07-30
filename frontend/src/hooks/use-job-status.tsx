import { useState, useEffect, useCallback } from "react";
import { $api } from "./index";
import { toast } from "sonner";

interface JobStatus {
  job_id: string;
  user_id: string;
  job_type: "3d_asset_generation" | "video_processing";
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  modified_at: string;
  started_at?: string;
  completed_at?: string;
  progress?: number;
  result?: Record<string, any>;
  error?: string;
  webhook_url?: string;
}

interface UseJobStatusOptions {
  jobId: string;
  pollInterval?: number; // milliseconds
  onStatusChange?: (status: JobStatus) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useJobStatus({
  jobId,
  pollInterval = 2000,
  onStatusChange,
  onComplete,
  onError,
}: UseJobStatusOptions) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await $api.get(`/api/jobs/${jobId}`);
      const status = response.data as JobStatus;
      
      setJobStatus(status);
      setError(null);
      onStatusChange?.(status);

      // Handle completion
      if (status.status === "completed" && onComplete) {
        onComplete(status.result);
      }

      // Handle errors
      if (status.status === "failed" && onError) {
        onError(status.error || "Job failed");
      }

      return status;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch job status";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId, onStatusChange, onComplete, onError]);

  // Initial fetch
  useEffect(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  // Polling
  useEffect(() => {
    if (!jobId || jobStatus?.status === "completed" || jobStatus?.status === "failed") {
      return;
    }

    const interval = setInterval(fetchJobStatus, pollInterval);
    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status, pollInterval, fetchJobStatus]);

  // Webhook connection (Server-Sent Events)
  useEffect(() => {
    if (!jobId || jobStatus?.status === "completed" || jobStatus?.status === "failed") {
      return;
    }

    const eventSource = new EventSource(`/api/webhooks/${jobId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "job_update") {
          fetchJobStatus(); // Refresh status when we get an update
        }
      } catch (err) {
        console.error("Error parsing webhook event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Webhook connection error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId, jobStatus?.status, fetchJobStatus]);

  return {
    jobStatus,
    isLoading,
    error,
    refetch: fetchJobStatus,
  };
}

// Hook for getting all user jobs
export function useUserJobs(limit: number = 50) {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await $api.get(`/api/jobs?limit=${limit}`);
      setJobs(response.data as JobStatus[]);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch jobs";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs,
  };
} 