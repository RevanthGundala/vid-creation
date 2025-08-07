import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { $api } from '.';
import { toast } from 'sonner';

interface UseJobStatusOptions {
  jobId: string;
  onStatusChange?: (status: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  enableWebhook?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  // Fallback polling interval if webhook fails
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
      onStatusChangeRef.current?.(jobStatus.status);

      // Handle completion
      if (jobStatus.status === "completed" && onCompleteRef.current) {
        onCompleteRef.current(jobStatus.result);
        // Invalidate related queries when job completes
        queryClient.invalidateQueries({
          queryKey: ['get', '/api/jobs']
        });
        queryClient.invalidateQueries({
          queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: jobId } } }]
        });
      }

      // Handle errors
      if (jobStatus.status === "failed" && onErrorRef.current) {
        onErrorRef.current(jobStatus.error || "Job failed");
      }
    }
  }, [jobStatus, queryClient, jobId]);

  // Handle query errors
  useEffect(() => {
    if (error && !hasShownError.current) {
      hasShownError.current = true;
      const errorMessage = Array.isArray(error.detail) 
        ? error.detail[0]?.msg || "Failed to fetch job status"
        : "Failed to fetch job status";
      toast.error(errorMessage);
    }
  }, [error]);

  // Webhook connection for real-time updates
  useEffect(() => {
    if (!enableWebhook || !jobId) return;

    const connectWebhook = () => {
      try {
        const webhookUrl = `${import.meta.env.VITE_API_URL}/api/webhooks/${jobId}/stream`;
        const eventSource = new EventSource(webhookUrl);
        
        eventSource.onopen = () => {
          console.log(`Webhook connected for job ${jobId}`);
          setIsWebhookConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Webhook message received:', data);
            
            // Update job status in cache
            queryClient.setQueryData(
              ['get', '/api/jobs/{job_id}', { params: { path: { job_id: jobId } } }],
              data
            );
            
            // Call status change callback
            onStatusChangeRef.current?.(data.status);
            
            // Handle completion
            if (data.status === "completed" && onCompleteRef.current) {
              onCompleteRef.current(data.result);
              // Invalidate related queries
              queryClient.invalidateQueries({
                queryKey: ['get', '/api/jobs']
              });
              queryClient.invalidateQueries({
                queryKey: ['get', '/api/jobs/{job_id}/asset-url', { params: { path: { job_id: jobId } } }]
              });
            }
            
            // Handle errors
            if (data.status === "failed" && onErrorRef.current) {
              onErrorRef.current(data.error || "Job failed");
            }
          } catch (parseError) {
            console.error('Failed to parse webhook message:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error(`Webhook error for job ${jobId}:`, error);
          setIsWebhookConnected(false);
          eventSource.close();
          
          // Fallback to polling if webhook fails
          setTimeout(() => {
            refetch();
          }, 1000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Failed to connect to webhook:', error);
        setIsWebhookConnected(false);
      }
    };

    connectWebhook();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsWebhookConnected(false);
    };
  }, [jobId, enableWebhook, queryClient, refetch]);

  return {
    jobStatus,
    error: error ? (Array.isArray(error.detail) 
      ? error.detail[0]?.msg || "Failed to fetch job status"
      : "Failed to fetch job status") : null,
    isLoading,
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