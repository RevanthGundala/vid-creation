import { $api } from "../hooks";
import { toast } from "sonner";
import { useJobStatus } from "./use-job-status";
import { useState } from "react";
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
}

export function useVideo(options?: GenerateVideoOptions) {
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const generateVideoMutation = $api.useMutation("post", "/api/jobs", {
        onMutate: () => {
        },
        onSuccess: (data: Job) => { // Changed to Job type
            // The backend returns job_id, not project_id
            setCurrentJobId(data.job_id);
            options?.onSuccess?.(data);
            toast.success("Video generation started!");
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
            setTimeout(() => setCurrentJobId(null), 100);
        },
        onError: (error) => {
            console.error("Job failed:", error);
            options?.onJobError?.(error);
            toast.error(`Video generation failed: ${error}`);
            // Add a small delay before resetting to prevent flash
            setTimeout(() => setCurrentJobId(null), 100);
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

    const isGenerating = generateVideoMutation.isPending || 
        (currentJobId && jobStatus?.jobStatus?.status && ["queued", "processing"].includes(jobStatus.jobStatus.status)) ||
        (currentJobId && !jobStatus?.jobStatus?.status); // Keep loading while job status is being fetched
    
    console.log('🔍 useVideo debug:', {
        generateVideoMutationIsPending: generateVideoMutation.isPending,
        currentJobId,
        jobStatusStatus: jobStatus?.jobStatus?.status,
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