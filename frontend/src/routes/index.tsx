import { createFileRoute, redirect } from '@tanstack/react-router';
import { SHARED_PROJECT_ID } from '../config/shared-project';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Redirect ALL users to the shared project
    throw redirect({ to: `/_auth/projects/${SHARED_PROJECT_ID}` });
  },
  component: LandingPage,
});

function LandingPage() {
  // This component will never be rendered due to the redirect
  return null;
}