import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../types/api";

export const fetchClient = createFetchClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });
export const $api = createClient(fetchClient);

export { use3dAsset } from './use-3d-asset'
export { useUploadVideo } from './use-upload-video'