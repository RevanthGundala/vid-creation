import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { Button } from "./button"
export { Dialog } from "./dialog"
export { TextField } from "./text-field"
export { DropdownMenu } from "./dropdown-menu"
export { Switch } from "./switch"
export { Tooltip } from "./tooltip"
export { Toast } from "./toast"

export { ToastTitle } from "./toast"