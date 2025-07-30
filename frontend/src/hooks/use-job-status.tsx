import { useState, useEffect, useCallback, useRef } from "react";
import { $api, fetchClient } from "./index";
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
  const hasShownError = useRef(false);
  
  // Store callbacks in refs to prevent infinite loops
  const onStatusChangeRef = useRef(onStatusChange);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onStatusChange, onComplete, onError]);

  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetchClient.GET(`/api/jobs/{job_id}`, {
        params: { path: { job_id: jobId } }
      });
      const status = response.data as JobStatus;
      
      setJobStatus(status);
      setError(null);
      hasShownError.current = false; // Reset error flag on success
      onStatusChangeRef.current?.(status);

      // Handle completion
      if (status.status === "completed" && onCompleteRef.current) {
        onCompleteRef.current(status.result);
      }

      // Handle errors
      if (status.status === "failed" && onErrorRef.current) {
        onErrorRef.current(status.error || "Job failed");
      }

      return status;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch job status";
      setError(errorMessage);
      // Only show toast once per error
      if (!hasShownError.current) {
        toast.error(errorMessage);
        hasShownError.current = true;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

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

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/api/webhooks/${jobId}/stream`);
    
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
      const response = await fetchClient.GET(`/api/jobs`, {
        params: { query: { limit: limit } }
      });
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