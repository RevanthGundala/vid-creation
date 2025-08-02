import { GaussianSplat } from "../splat/GaussianSplat";

interface EditorProps {
  assetUrl?: string;
}

export function Editor({ assetUrl }: EditorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white">
      <GaussianSplat assetUrl={assetUrl} />
    </div>
  );
}