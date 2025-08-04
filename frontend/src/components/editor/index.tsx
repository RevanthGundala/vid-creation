import { GaussianSplatDirectURL } from "../splat/GaussianSplatDirectURL";

interface EditorProps {
  assetUrl?: string;
}

export function Editor({ assetUrl }: EditorProps) {
  console.log('🎨 Editor component rendered with assetUrl:', assetUrl);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white">
      <GaussianSplatDirectURL assetUrl={assetUrl} />
    </div>
  );
}