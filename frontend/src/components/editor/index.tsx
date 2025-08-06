import { EditComponent } from "./edit";

interface EditorProps {
  assetUrl?: string;
  videos?: Array<{
    id: string;
    url?: string;
    title?: string;
  }>;
  isGenerating?: boolean;
}

export function Editor({ assetUrl, videos = [], isGenerating = false }: EditorProps) {
  console.log('🎨 Editor component rendered with assetUrl:', assetUrl);
  console.log('📹 Videos:', videos);
  console.log('🔄 Is Generating:', isGenerating);
  
  return (
    <div className="bg-white text-black">
      <EditComponent incomingEdit="Video Editor" videos={videos} isGenerating={isGenerating} />
    </div>
  );
}