import { $api } from ".";

interface SignedUploadUrlRequest {
    filename: string;
    file: File; 
} 

interface UploadVideoOptions {
    onSuccess?: (blobName: string) => void;
    onError?: (error: string) => void;
}

export function useUploadVideo(options?: UploadVideoOptions) {
    // Mutation for uploading the video file
    const uploadMutation = $api.useMutation("post", "/api/jobs", {
        onSuccess: (data: any) => {
            options?.onSuccess?.(data.blobName);
        },
        onError: (error: any) => {
            options?.onError?.(error.message || "Failed to upload video");
        },
    });

    // Function to handle the upload process
    const uploadVideo = async ({ filename, file }: SignedUploadUrlRequest) => {
        try {
            // TODO: Implement proper upload logic
            console.log("Upload video:", { filename, file });
            
            // For now, just call the mutation with mock data
            uploadMutation.mutate({
                body: {
                    blobName: "mock-blob-name",
                    filename,
                    fileSize: file.size,
                    contentType: file.type,
                },
            } as any);

            return { data: "mock-blob-name", error: null };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            options?.onError?.(errorMessage);
            return { data: null, error: errorMessage };
        }
    };

    return {
        uploadVideo,
        isUploading: uploadMutation.isPending,
        uploadError: uploadMutation.error,
        uploadData: uploadMutation.data,
    };
}