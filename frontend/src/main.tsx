import './app.css';
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { AuthProvider, useAuth } from './contexts/auth-context'

// This will be populated by the router instance
declare module '@tanstack/react-router' {
  interface Register {
    router: any
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      retryDelay: 1000,
    },
  },
})

// Create a component that provides the auth context to the router
function InnerApp() {
  const auth = useAuth();
  
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      auth: {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
      },
    },
  })

  return <RouterProvider router={router} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('app')
if (rootElement) {
  const root = createRoot(rootElement)
  root.render(
    // <PostHogProvider
    //   apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    //   options={{
    //     api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    //     defaults: '2025-05-24',
    //     capture_exceptions: true, // This enables capturing exceptions using Error Tracking
    //     debug: import.meta.env.MODE === 'development',
    //   }}
    // >
      <App />
    // </PostHogProvider>
  )
}