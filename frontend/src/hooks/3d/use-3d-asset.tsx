import { toast } from "sonner";
import { $api } from "..";


interface Generate3dAssetRequest {
    prompt?: string | null;
    imageUrl?: string | null;
}

interface Generate3dAssetOptions {
    onSuccess?: (success: any) => void;
    onError?: (error: any) => void;
}

export function useGenerate3dAsset(options?: Generate3dAssetOptions) {
    const generate3dAssetMutation = $api.useMutation("post", "/generate-3d-asset", {
        onSuccess: (data) => {
            console.log(data);
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            console.error(error);
            options?.onError?.(error);
        },
    });
    const generate3dAsset = async ({ prompt, imageUrl }: Generate3dAssetRequest) => {
        try {
            if (!prompt && !imageUrl) {
                toast.error("Please provide a prompt or image URL");
                return { data: null, error: "Please provide a prompt or image URL" };
            }
            generate3dAssetMutation.mutate({
                prompt,
                imageUrl,
            });
            
            return { data: generate3dAssetMutation.data, error: null };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            return { data: null, error: errorMessage };
        }
    };

    return {
        generate3dAsset,
        isGenerating: generate3dAssetMutation.isPending,
        generate3dAssetError: generate3dAssetMutation.error,
        generate3dAssetData: generate3dAssetMutation.data,
    };
}