import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "./index";
import { toast } from "sonner";
import type { components } from "../types/api";

type Job = components["schemas"]["Job"];

interface UseJobStatusOptions {
  jobId: string;
  onStatusChange?: (status: Job) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  enableWebhook?: boolean; // Allow disabling webhook for testing
  staleTime?: number; // React Query stale time
  refetchInterval?: number | false; // Fallback polling interval if webhook fails
}

export function useJobStatus({
  jobId,
  onStatusChange,
  onComplete,
  onError,
  enableWebhook = true,
  staleTime = 0, // Always consider data stale to allow real-time updates
  refetchInterval = false, // Disable polling by default, rely on webhooks
}: UseJobStatusOptions) {
  const queryClient = useQueryClient();
  const [isWebhookConnected, setIsWebhookConnected] = useState(false);
  const hasShownError = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
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

  // Use $api.useQuery for job status
  const {
    data: jobStatus,
    error,
    isLoading,
    refetch,
  } = $api.useQuery(
    "get",
    "/api/jobs/{job_id}",
    {
      params: {
        path: { job_id: jobId },
      },
    },
    {
      staleTime,
      refetchInterval: refetchInterval,
      enabled: !!jobId,
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or other client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  // Handle success and error callbacks
  useEffect(() => {
    if (jobStatus) {
      // Reset error flag on success
      hasShownError.current = false;
      onStatusChangeRef.current?.(jobStatus);

      // Handle completion
      if (jobStatus.status === "completed" && onCompleteRef.current) {
        onCompleteRef.current(jobStatus.result);
      }

      // Handle errors
      if (jobStatus.status === "failed" && onErrorRef.current) {
        onErrorRef.current(jobStatus.error || "Job failed");
      }
    }
  }, [jobStatus]);

  // Handle query errors
  useEffect(() => {
    if (error) {
      const errorMessage = Array.isArray(error.detail) 
        ? error.detail[0]?.msg || "Failed to fetch job status"
        : "Failed to fetch job status";
      // Only show toast once per error
      if (!hasShownError.current) {
        toast.error(errorMessage);
        hasShownError.current = true;
      }
    }
  }, [error]);

  // Webhook connection using Server-Sent Events
  useEffect(() => {
    if (!jobId || !enableWebhook) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Only set up webhook if job is not already completed or failed
    if (jobStatus?.status === "completed" || jobStatus?.status === "failed") {
      return;
    }

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/api/webhooks/${jobId}/stream`);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsWebhookConnected(true);
      console.log(`Webhook connected for job ${jobId}`);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "job_update") {
          // Update job status directly from webhook data
          const updatedJob = data.job as Job;
          
          // Update React Query cache with new data
          queryClient.setQueryData(["get", "/api/jobs/{job_id}", { params: { path: { job_id: jobId } } }], updatedJob);
          
          onStatusChangeRef.current?.(updatedJob);

          // Handle completion
          if (updatedJob.status === "completed" && onCompleteRef.current) {
            onCompleteRef.current(updatedJob.result);
            eventSource.close(); // Close connection on completion
          }

          // Handle errors
          if (updatedJob.status === "failed" && onErrorRef.current) {
            onErrorRef.current(updatedJob.error || "Job failed");
            eventSource.close(); // Close connection on error
          }
        } else if (data.type === "ping") {
          // Handle ping messages to keep connection alive
          console.log("Webhook ping received");
        }
      } catch (err) {
        console.error("Error parsing webhook event:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Webhook connection error:", err);
      setIsWebhookConnected(false);
      
      // If webhook fails, enable polling as fallback
      if (refetchInterval === false) {
        console.log("Webhook failed, enabling polling as fallback");
        // This will trigger a refetch through React Query
        refetch();
      }
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          console.log("Attempting to reconnect webhook...");
          eventSource.close();
          // The useEffect will handle reconnection
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsWebhookConnected(false);
    };
  }, [jobId, enableWebhook, jobStatus?.status, queryClient, refetch, refetchInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    jobStatus,
    isLoading,
    error: error ? (Array.isArray(error.detail) 
      ? error.detail[0]?.msg || "Failed to fetch job status"
      : "Failed to fetch job status") : null,
    isWebhookConnected,
    refetch,
  };
}

// Hook for getting all user jobs using $api
export function useUserJobs(limit: number = 50) {
  const {
    data: jobs = [],
    error,
    isLoading,
    refetch,
  } = $api.useQuery(
    "get",
    "/api/jobs",
    {
      params: {
        query: { limit: limit },
      },
    },
    {
      staleTime: 30000, // Consider data fresh for 30 seconds
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or other client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  // Handle query errors
  useEffect(() => {
    if (error) {
      const errorMessage = Array.isArray(error.detail) 
        ? error.detail[0]?.msg || "Failed to fetch jobs"
        : "Failed to fetch jobs";
      toast.error(errorMessage);
    }
  }, [error]);

  return {
    jobs,
    isLoading,
    error: error ? (Array.isArray(error.detail) 
      ? error.detail[0]?.msg || "Failed to fetch jobs"
      : "Failed to fetch jobs") : null,
    refetch,
  };
} 