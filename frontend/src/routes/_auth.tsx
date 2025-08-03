import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getAccessToken } from '../hooks/use-session-storage';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    // TODO: use the actual session storage hook to check for access token
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <>
      <Outlet />
    </>
  ),
});
