import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // gen

export const client = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });

export { generateVideo, uploadVideo } from './video';