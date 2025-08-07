import { VideoGrid } from '../VideoGrid'

interface EditProps {
    videos?: Array<{
        id: string
        url?: string
        title?: string
    }>
    isGenerating?: boolean | null;
}

export function EditComponent({ videos = [], isGenerating = false }: EditProps) {
    return (
        <div className="w-full p-4">
            <VideoGrid videos={videos} columns={3} isGenerating={isGenerating || false} />
        </div>
    )
}