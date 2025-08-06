import { $api } from "../hooks";
import { toast } from "sonner";
import { useJobStatus } from "./use-job-status";
import { useState } from "react";
import type { components } from "../types/api";

type JobCreate = components["schemas"]["JobCreate"];
type Job = components["schemas"]["Job"];
type JobType = components["schemas"]["JobType"];

// Constants to ensure we use the correct job types
const JOB_TYPE_3D_OBJECT: JobType = "Object";

// Interface for 3D asset generation request
interface Generate3DAssetRequest {
    prompt: string;
    project_id: string;
}

interface Generate3dAssetOptions {
    onSuccess?: (data: any) => void; // Changed to any as JobCreate type is not directly used here
    onError?: (error: any) => void;
    onJobComplete?: (result: any) => void;
    onJobError?: (error: string) => void;
}

export function use3dAsset(options?: Generate3dAssetOptions) {
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const generate3dAssetMutation = $api.useMutation("post", "/api/jobs", {
        onMutate: () => {
        },
        onSuccess: (data: Job) => { // Changed to Job type
            // The backend returns job_id, not project_id
            setCurrentJobId(data.job_id);
            options?.onSuccess?.(data);
            toast.success("3D asset generation started!");
        },
        onError: (error) => {
            console.error("❌ Failed to create job:", error);
            
            options?.onError?.(error);
            toast.error("Failed to start 3D asset generation - Backend configuration issue");
        },
    });

    // Use job status hook to track the current job
    const jobStatus = useJobStatus({
        jobId: currentJobId || "",
        onComplete: (result) => {
            console.log("Job completed:", result);
            options?.onJobComplete?.(result);
            toast.success("3D asset generation completed!");
            setCurrentJobId(null); // Reset current job
        },
        onError: (error) => {
            console.error("Job failed:", error);
            options?.onJobError?.(error);
            toast.error(`3D asset generation failed: ${error}`);
            setCurrentJobId(null); // Reset current job
        },
    });

    const generate3dAsset = async ({ prompt, project_id }: Generate3DAssetRequest): Promise<void> => {
        try {
            console.log('🚀 generate3dAsset called with:', { prompt, project_id });
            console.log('API client:', $api);
            console.log('Mutation state:', generate3dAssetMutation);
            
            if (!prompt) {
                toast.error("Please provide a prompt");
                return;
            }

            if (!project_id) {
                throw new Error("Project ID is required");
            }
            
            const requestBody: JobCreate = {
                project_id,
                job_type: JOB_TYPE_3D_OBJECT,
                parameters: {
                    prompt: prompt,
                    file_type: "ksplat", // TODO: make this dynamic
                },
            };
            
            generate3dAssetMutation.mutate({
                body: requestBody,
            });
            
            console.log('Mutation called successfully');
        } catch (error) {
            console.error("Error generating 3D asset:", error);
            toast.error("Failed to generate 3D asset");
        }
    };

    return {
        generate3dAsset,
        isGenerating: generate3dAssetMutation.isPending,
        currentJobId,
        jobStatus: jobStatus.jobStatus,
        isJobLoading: jobStatus.isLoading,
        jobError: jobStatus.error,
    };
}