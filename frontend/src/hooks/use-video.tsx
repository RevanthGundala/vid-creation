import { $api } from "../hooks";
import { toast } from "sonner";
import { useJobStatus } from "./use-job-status";
import { useState, useRef } from "react";
import type { components } from "../types/api";

type JobCreate = components["schemas"]["JobCreate"];
type Job = components["schemas"]["Job"];
type JobType = components["schemas"]["JobType"];

// Constants to ensure we use the correct job types
const JOB_TYPE_VIDEO: JobType = "Video";

// Interface for video generation request
interface GenerateVideoRequest {
    prompt: string;
    project_id: string;
}

interface GenerateVideoOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onJobComplete?: (result: any) => void;
    onJobError?: (error: any) => void;
    projectId?: string; // Add projectId to make the hook project-aware
}

export function useVideo(options?: GenerateVideoOptions) {
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    
    // Use refs to track toast IDs and completion state
    const startedToastIdRef = useRef<string | number | null>(null);
    const hasCompletedRef = useRef<boolean>(false);

    const generateVideoMutation = $api.useMutation("post", "/api/jobs", {
        onMutate: () => {
            // Reset completion state when starting a new job
            hasCompletedRef.current = false;
        },
        onSuccess: (data: Job) => {
            // Add null checks to prevent TypeError
            if (data && data.job_id) {
                setCurrentJobId(data.job_id);
                options?.onSuccess?.(data);
                
                // Dismiss any existing toasts and show the started message
                if (startedToastIdRef.current) {
                    toast.dismiss(startedToastIdRef.current);
                }
                startedToastIdRef.current = toast.success("Video generation started!", {
                    duration: 5000, // Keep it for 5 seconds
                });
            } else {
                console.error("❌ Invalid response data:", data);
                options?.onError?.("Invalid response from server");
                toast.error("Failed to start video generation - Invalid response");
            }
        },
        onError: (error) => {
            console.error("❌ Failed to create job:", error);
            
            options?.onError?.(error);
            toast.error("Failed to start video generation - Backend configuration issue");
        },
    });

    // Use job status hook to track the current job
    const jobStatus = useJobStatus({
        jobId: currentJobId || "",
        onStatusChange: (status) => {
            console.log("Job status changed:", status);
        },
        onComplete: (result) => {
            // Prevent duplicate completion handling
            if (hasCompletedRef.current) {
                console.log("Job completion already handled, ignoring duplicate");
                return;
            }
            
            console.log("Job completed:", result);
            hasCompletedRef.current = true;
            
            options?.onJobComplete?.(result);
            
            // Dismiss the "started" toast and show completion
            if (startedToastIdRef.current) {
                toast.dismiss(startedToastIdRef.current);
                startedToastIdRef.current = null;
            }
            
            // Check if we have a real Replicate URL or using backup
            const hasReplicateUrl = result && 
                result.replicate_url && 
                result.replicate_url.trim() !== "";
            
            const message = hasReplicateUrl 
                ? "Video generation completed!" 
                : "Replicate API token not set, using back up video";
            
            toast.success(message);
            setCurrentJobId(null);
        },
        onError: (error) => {
            console.error("Job failed:", error);
            options?.onJobError?.(error);
            
            // Dismiss the "started" toast and show error
            if (startedToastIdRef.current) {
                toast.dismiss(startedToastIdRef.current);
                startedToastIdRef.current = null;
            }
            
            toast.error(`Video generation failed: ${error}`);
            // Clear the current job immediately when failed
            setCurrentJobId(null);
            hasCompletedRef.current = false;
        },
    });

    const generateVideo = async ({ prompt, project_id }: GenerateVideoRequest) => {
        try {
            console.log('🚀 generateVideo called with:', { prompt, project_id });
            console.log('API client:', $api);
            console.log('Mutation state:', generateVideoMutation);
            
            if (!prompt) {
                toast.error("Please provide a prompt");
                return;
            }

            if (!project_id) {
                throw new Error("Project ID is required");
            }
            
            const requestBody: JobCreate = {
                project_id,
                job_type: JOB_TYPE_VIDEO,
                parameters: {
                    prompt: prompt,
                    file_type: "mp4", // TODO: make this dynamic
                },
            };
            
            generateVideoMutation.mutate({
                body: requestBody,
            });
            
            console.log('Mutation called successfully');
        } catch (error) {
            console.error("Error generating video:", error);
            toast.error("Failed to generate video");
        }
    };

    // Show generating if:
    // 1. Mutation is pending, OR
    // 2. We have a currentJobId and either:
    //    - Job status is loading (initial fetch), OR
    //    - Job status shows queued/processing
    const isGeneratingRaw = generateVideoMutation.isPending ||
        (currentJobId && (
            jobStatus.isLoading || // Show loading while fetching job status
            (jobStatus?.jobStatus?.status &&
             ["queued", "processing"].includes(jobStatus.jobStatus.status))
        ) && (!options?.projectId || !jobStatus?.jobStatus?.project_id || jobStatus.jobStatus.project_id === options.projectId));
    const isGenerating = Boolean(isGeneratingRaw);
    
    return {
        generateVideo,
        isGenerating,
        currentJobId,
        jobStatus: jobStatus?.jobStatus?.status,
        isJobLoading: jobStatus.isLoading,
        jobError: jobStatus.error,
    };
}
