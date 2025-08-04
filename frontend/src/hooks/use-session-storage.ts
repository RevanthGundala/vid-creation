import { useQueryClient } from '@tanstack/react-query';
import { $api } from '.';

export function useSessionStorage() {
  const queryClient = useQueryClient();

  // Query to get current user session from backend
  const { data: user, isLoading, refetch, error } = $api.useQuery(
    'get',
    '/api/auth/me',
    undefined, // No parameters needed
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        console.log('Auth retry attempt:', failureCount, 'Error:', error);
        // Don't retry on 401 (unauthorized)
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      onError: (error: any) => {
        console.error('Auth error:', error);
      },
    }
  );

  // Log the user data for debugging
  console.log('Current user data:', user);
  console.log('Auth error:', error);

  // Mutation to sign out using $api
  const signOutMutation = $api.useMutation('post', '/api/auth/logout', {
    onSuccess: () => {
      // Clear session data from cache
      queryClient.setQueryData(['user'], null);
      queryClient.clear(); // Clear all queries when logging out
    },
  });

  // Mutation to login using $api
  const loginMutation = $api.useMutation('get', '/api/auth/login', {
    onSuccess: (data) => {
      // After successful login, refetch the user session
      refetch();
    },
  });

  // Helper functions
  const signOut = async (): Promise<void> => {
    await signOutMutation.mutateAsync({});
  };

  const login = async (): Promise<void> => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login`;
  };

  const refreshSession = () => {
    refetch();
  };

  // Computed values
  const isAuthenticated = !!user;
  const isSigningOut = signOutMutation.isPending;
  const isLoggingIn = loginMutation.isPending;

  return {
    user: user || null,
    isLoading,
    signOut,
    login,
    refreshSession,
    isAuthenticated,
    isSigningOut,
    isLoggingIn,
  };
}