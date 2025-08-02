import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { auth } from '../utils/firebase';
import { Navbar } from '../components/navbar';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    // Wait for auth state to be determined
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (!user) {
          throw redirect({ to: '/login' });
        }
        resolve(undefined);
      });
    });
  },
  component: () => (
    <>
      {/* <Navbar /> */}
      <Outlet />
    </>
  ),
});
