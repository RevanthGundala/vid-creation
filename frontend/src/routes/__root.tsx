import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { AuthProvider } from '../contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRouteWithContext()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <div className="w-screen h-screen overflow-hidden">
          <main className="w-full h-full">
            <Outlet />
            <Toaster />
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
