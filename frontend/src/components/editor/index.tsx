import { GaussianSplat } from "../splat/GaussianSplat";
import { useState } from "react";
import { EditComponent } from "./edit";

interface EditorProps {
  assetUrl?: string;
}

export function Editor({ assetUrl }: EditorProps) {
  const [edits, setEdits] = useState<string[]>([])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <GaussianSplat assetUrl={assetUrl} />
      {edits.map((edit, index) => (
        <EditComponent key={index} incomingEdit={edit} />
      ))}
    </div>
  );
}