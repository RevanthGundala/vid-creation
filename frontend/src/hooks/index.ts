import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./my-openapi-3-schema";

export const fetchClient = createFetchClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });
export const $api = createClient(fetchClient);

export { useUploadVideo } from './video';