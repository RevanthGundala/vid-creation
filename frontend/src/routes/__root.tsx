import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';

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
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
