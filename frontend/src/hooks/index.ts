import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../types/api";
import { auth } from "../utils/firebase";

// Create a custom fetch function that adds auth headers
const authenticatedFetch = async (input: Request): Promise<Response> => {
  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      const headers = new Headers(input.headers);
      headers.set('Authorization', `Bearer ${idToken}`);
      
      const newRequest = new Request(input, {
        headers,
      });
      
      return fetch(newRequest);
    } catch (error) {
      console.error('Failed to get ID token:', error);
    }
  }
  
  return fetch(input);
};

// Create a fetch client with custom fetch function
export const fetchClient = createFetchClient<paths>({ 
  baseUrl: import.meta.env.VITE_API_URL,
  fetch: authenticatedFetch,
});

export const $api = createClient(fetchClient);

export { use3dAsset } from './use-3d-asset'
export { useUploadVideo } from './use-upload-video'
export { useProject } from './use-project'
export type { Project } from './use-project'