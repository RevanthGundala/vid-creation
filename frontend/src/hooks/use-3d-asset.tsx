import { $api } from "../hooks";
import { toast } from "sonner";
import { auth } from "../utils/firebase";
import { useJobStatus } from "./use-job-status";
import { useState } from "react";
import type { components } from "../types/api";

type Generate3DAssetRequest = components["schemas"]["Generate3DAssetRequest"];
type Generate3DAssetResponse = components["schemas"]["Generate3DAssetResponse"];

interface Generate3dAssetOptions {
    onSuccess?: (data: Generate3DAssetResponse) => void;
    onError?: (error: any) => void;
    onJobComplete?: (result: any) => void;
    onJobError?: (error: string) => void;
}

export function use3dAsset(options?: Generate3dAssetOptions) {
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const generate3dAssetMutation = $api.useMutation("post", "/api/generate-3d-asset", {
        onSuccess: (data: Generate3DAssetResponse) => {
            console.log("Job created:", data);
            // Use project_id for now until we regenerate types
            setCurrentJobId(data.project_id);
            options?.onSuccess?.(data);
            toast.success("3D asset generation started!");
        },
        onError: (error) => {
            console.error("Failed to create job:", error);
            options?.onError?.(error);
            toast.error("Failed to start 3D asset generation");
        },
    });

    // Use job status hook to track the current job
    const jobStatus = useJobStatus({
        jobId: currentJobId || "",
        pollInterval: 2000,
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

    const generate3dAsset = async ({ prompt }: Generate3DAssetRequest) => {
        try {
            if (!prompt) {
                toast.error("Please provide a prompt");
                return;
            }

            generate3dAssetMutation.mutate({
                body: {
                    prompt,
                },
            });
        } catch (error) {
            console.error("Error generating 3D asset:", error);
            toast.error("Failed to generate 3D asset");
        }
    };

    const downloadAsset = async (jobId: string) => {
        try {
            // For now, use the old endpoint structure until we regenerate types
            const response = await fetch(`/api/assets/${jobId}/ksplat`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${jobId}.ksplat`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success("Asset downloaded successfully!");
        } catch (error) {
            console.error("Error downloading asset:", error);
            toast.error("Failed to download asset");
        }
    };

    return {
        generate3dAsset,
        downloadAsset,
        isGenerating: generate3dAssetMutation.isPending,
        currentJobId,
        jobStatus: jobStatus.jobStatus,
        isJobLoading: jobStatus.isLoading,
        jobError: jobStatus.error,
    };
}