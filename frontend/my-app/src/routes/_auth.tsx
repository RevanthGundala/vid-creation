import { createFileRoute, Outlet, redirect } from '@tanstack/solid-router';
import { auth } from '../utils/firebase'; // Import the Firebase auth instance
import Navbar from '../components/navbar';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (!auth.currentUser) {
      throw redirect({ to: '/' });
    }
  },
  component: () => (
    <>
      <Navbar />
      <Outlet />
    </>
  ),
}); 