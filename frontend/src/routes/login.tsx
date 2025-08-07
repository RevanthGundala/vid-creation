// TODO: use our own - currently using WorkOS login page

import { createFileRoute, redirect } from '@tanstack/react-router';
import { SHARED_PROJECT_ID } from "../config/shared-project";

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Redirect ALL users to the shared project
    throw redirect({ to: `/projects/${SHARED_PROJECT_ID}` });
  },
  component: Authentication,
});

function Authentication() {
  // This component will never be rendered due to the redirect
  return null;
}


