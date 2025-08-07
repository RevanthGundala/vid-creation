import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { SHARED_PROJECT_ID } from '../../../config/shared-project'

export const Route = createFileRoute('/_auth/projects/')({
  beforeLoad: async () => {
    // Automatically redirect to the shared project
    throw redirect({ to: `/_auth/projects/${SHARED_PROJECT_ID}` });
  },
  component: ProjectsComponent,
})

function ProjectsComponent() {
  // This component will never be rendered due to the redirect
  return null;
}
