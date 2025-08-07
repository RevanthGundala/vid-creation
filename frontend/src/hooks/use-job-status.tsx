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
  refetchInterval = 5000, // Default to 5s polling as fallback
}: UseJobStatusOptions) {
  const queryClient = useQueryClient();
  const [isWebhookConnected, setIsWebhookConnected] = useState(false);
  const [lastWebhookActivity, setLastWebhookActivity] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Store callbacks in refs to prevent infinite loops
  const onStatusChangeRef = useRef(onStatusChange);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  
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
    }
  );


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
          setLastWebhookActivity(Date.now());
          onStatusChangeRef.current?.('connected');
          refetch();
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Webhook message received:', data);
            setLastWebhookActivity(Date.now());
            
            // Skip connection messages - only process actual job status updates
            if (data.type === 'connected') {
              console.log('WebSocket connection confirmed for job:', data.job_id);
              return;
            }
            
            // Only process messages that have a status field (actual job updates)
            if (!data.status) {
              console.log('Received message without status, skipping:', data);
              return;
            }
            
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
          setLastWebhookActivity(null);
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
        setLastWebhookActivity(null);
      }
    };

    connectWebhook();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsWebhookConnected(false);
      setLastWebhookActivity(null);
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
