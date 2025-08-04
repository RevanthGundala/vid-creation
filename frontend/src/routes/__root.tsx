import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

// Define the router context type
interface RouterContext {
  auth: {
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-screen h-screen overflow-hidden">
        <main className="w-full h-full">
          <Outlet />
          <Toaster />
        </main>
      </div>
    </ThemeProvider>
  );
}
