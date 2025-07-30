import { $api, fetchClient } from "..";

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
    const uploadMutation = $api.useMutation("put", "/upload-video", {
        onSuccess: (data) => {
            options?.onSuccess?.(data.blobName);
        },
        onError: (error) => {
            options?.onError?.(error.message || "Failed to upload video");
        },
    });

    // Function to handle the upload process
    const uploadVideo = async ({ filename, file }: SignedUploadUrlRequest) => {
        try {
            // First, get the signed upload URL
            const uploadUrlResponse = await fetchClient.POST("/generate-upload-url", {
                body: {
                    filename,
                },
            });

            if (uploadUrlResponse.error) {
                throw new Error(uploadUrlResponse.error.message || "Failed to get upload URL");
            }

            const { uploadUrl, blobName } = uploadUrlResponse.data;

            // Upload the file to the signed URL
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type || "video/mp4",
                },
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload video to storage");
            }

            // Call the mutation to update the backend with the upload info
            uploadMutation.mutate({
                body: {
                    blobName,
                    filename,
                    fileSize: file.size,
                    contentType: file.type,
                },
            });

            return { data: blobName, error: null };
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