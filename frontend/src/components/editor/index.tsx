import { GaussianSplat } from "../splat/GaussianSplat";
import { useState } from "react";
import { EditComponent } from "./edit";

 export function Editor() {
const [edits, setEdits] = useState<string[]>([])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <GaussianSplat />
      {edits.map((edit, index) => (
        <EditComponent key={index} incomingEdit={edit} />
      ))}
    </div>
  );
}