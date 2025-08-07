import { $api } from "../hooks";
import { toast } from "sonner";
import { useJobStatus } from "./use-job-status";
import { useState, useEffect, useRef } from "react";
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
    const [jobCreationTime, setJobCreationTime] = useState<number | null>(null);
    const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const generateVideoMutation = $api.useMutation("post", "/api/jobs", {
        onMutate: () => {
        },
        onSuccess: (data: Job) => { // Changed to Job type
            // Add debugging to see what we're getting
            console.log("🎯 onSuccess called with data:", data);
            console.log("🎯 data type:", typeof data);
            console.log("🎯 data.job_id:", data?.job_id);
            
            // Add null checks to prevent TypeError
            if (data && data.job_id) {
                setCurrentJobId(data.job_id);
                setJobCreationTime(Date.now());
                options?.onSuccess?.(data);
                toast.success("Video generation started!");
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
        onComplete: (result) => {
            console.log("Job completed:", result);
            options?.onJobComplete?.(result);
            toast.success("Video generation completed!");
            // Add a small delay before resetting to prevent flash
            setTimeout(() => {
                setCurrentJobId(null);
                setJobCreationTime(null);
            }, 100);
        },
        onError: (error) => {
            console.error("Job failed:", error);
            options?.onJobError?.(error);
            toast.error(`Video generation failed: ${error}`);
            // Add a small delay before resetting to prevent flash
            setTimeout(() => {
                setCurrentJobId(null);
                setJobCreationTime(null);
            }, 100);
        },
    });

    // More intelligent job cleanup logic
    useEffect(() => {
        if (currentJobId) {
            // Clear any existing timeout
            if (clearTimeoutRef.current) {
                clearTimeout(clearTimeoutRef.current);
                clearTimeoutRef.current = null;
            }

            // If we have a job status, handle completion/failure
            if (jobStatus?.jobStatus) {
                if (["completed", "failed"].includes(jobStatus.jobStatus.status)) {
                    console.log(`Job ${currentJobId} is ${jobStatus.jobStatus.status}, clearing currentJobId`);
                    setCurrentJobId(null);
                    setJobCreationTime(null);
                }
            } else if (jobStatus.error) {
                // Only clear if there's an actual error (job doesn't exist)
                console.log(`Job ${currentJobId} has error, clearing currentJobId:`, jobStatus.error);
                setCurrentJobId(null);
                setJobCreationTime(null);
            } else if (jobCreationTime) {
                // Give the job some time to become available (10 seconds)
                const timeElapsed = Date.now() - jobCreationTime;
                const maxWaitTime = 10000; // 10 seconds
                
                if (timeElapsed > maxWaitTime) {
                    console.log(`Job ${currentJobId} not found after ${maxWaitTime}ms, clearing currentJobId`);
                    clearTimeoutRef.current = setTimeout(() => {
                        setCurrentJobId(null);
                        setJobCreationTime(null);
                    }, 1000);
                }
            }
        }

        return () => {
            if (clearTimeoutRef.current) {
                clearTimeout(clearTimeoutRef.current);
                clearTimeoutRef.current = null;
            }
        };
    }, [currentJobId, jobStatus?.jobStatus, jobStatus.error, jobCreationTime]);

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
    //    - No job status yet (still loading/waiting for job to be available), OR  
    //    - Job status shows queued/processing
    const isGenerating = generateVideoMutation.isPending || 
        (currentJobId && (
            !jobStatus?.jobStatus?.status || // No status yet (job might not be queryable yet)
            ["queued", "processing"].includes(jobStatus.jobStatus.status)
        ) && (!options?.projectId || !jobStatus?.jobStatus?.project_id || jobStatus.jobStatus.project_id === options.projectId));
    
    console.log('🔍 useVideo debug:', {
        generateVideoMutationIsPending: generateVideoMutation.isPending,
        currentJobId,
        jobStatusStatus: jobStatus?.jobStatus?.status,
        jobStatusProjectId: jobStatus?.jobStatus?.project_id,
        expectedProjectId: options?.projectId,
        jobCreationTime,
        isGenerating
    });

    return {
        generateVideo,
        isGenerating,
        currentJobId,
        jobStatus: jobStatus?.jobStatus?.status,
        isJobLoading: jobStatus.isLoading,
        jobError: jobStatus.error,
    };
}
