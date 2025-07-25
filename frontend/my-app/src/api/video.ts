import { client } from ".";

// TODO: Add more than string as input
interface VideoRequest {
    prompt: string;
}
export async function generateVideo({ prompt }: VideoRequest) {
    const { data, error } = await client.PUT("/video", {
        body: {
            prompt,
        },
    });

    return { data, error }
}


interface SignedUploadUrlRequest {
    filename: string;
    file: File; 
} 

export async function uploadVideo({ filename, file }: SignedUploadUrlRequest) {
    const { data : { uploadUrl, blobName }, error } = await client.POST("/generate-upload-url", {
        body: {
            filename,
        },
    });
    if (error) {
        return { data: null, error }
    }
    // TODO: Implement chunked upload
    const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type || "video/mp4",
        },
    });
    if (!response.ok) {
        return { data: null, error: "Failed to upload video" }
    }
    return { data: blobName, error: null }
}

