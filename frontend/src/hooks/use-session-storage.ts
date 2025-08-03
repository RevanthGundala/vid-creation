// TODO: React Query might not be useful here, we can just use sessionStorage directly?
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SESSION_STORAGE_KEY } from '../constants';


interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

interface SessionData {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  tokens: TokenData;
}

// Helper functions for localStorage
const getStoredSession = (): SessionData | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading session from localStorage:', error);
    return null;
  }
};

const setStoredSession = (session: SessionData | null): void => {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error writing session to localStorage:', error);
  }
};

// Check if token is expired
const isTokenExpired = (expiresAt?: number): boolean => {
  if (!expiresAt) return false;
  return Date.now() >= expiresAt;
};

// Standalone function to get access token (can be used outside of React components)
export const getAccessToken = (): string | null => {
  const session = getStoredSession();
  if (!session?.tokens?.accessToken) return null;
  
  // Check if token is expired
  if (isTokenExpired(session.tokens.expiresAt)) {
    return null;
  }
  
  return session.tokens.accessToken;
};

export const authenticatedFetch = async (input: Request): Promise<Response> => {
  const accessToken = getAccessToken();
  const newRequest = new Request(input, {
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    },
  });
  
  return fetch(newRequest);
};

export function useSessionStorage() {
  const queryClient = useQueryClient();

  // Query to get current session
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: getStoredSession,
    staleTime: Infinity, // Session data doesn't become stale
    gcTime: Infinity, // Keep in cache indefinitely
  });

  // Mutation to set session
  const setSessionMutation = useMutation({
    mutationFn: async (newSession: SessionData) => {
      setStoredSession(newSession);
      return newSession;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(['session'], newSession);
    },
  });

  // Mutation to clear session
  const clearSessionMutation = useMutation({
    mutationFn: async () => {
      setStoredSession(null);
      return null;
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      queryClient.clear(); // Clear all queries when logging out
    },
  });

  // Mutation to update tokens
  const updateTokensMutation = useMutation({
    mutationFn: async (tokens: TokenData) => {
      const currentSession = getStoredSession();
      if (!currentSession) {
        throw new Error('No active session to update tokens for');
      }
      
      const updatedSession: SessionData = {
        ...currentSession,
        tokens,
      };
      
      setStoredSession(updatedSession);
      return updatedSession;
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['session'], updatedSession);
    },
  });

  // Helper functions
  const setSession = (sessionData: SessionData) => {
    setSessionMutation.mutate(sessionData);
  };

  const clearSession = () => {
    clearSessionMutation.mutate();
  };

  const updateTokens = (tokens: TokenData) => {
    updateTokensMutation.mutate(tokens);
  };

  const getAccessToken = (): string | null => {
    if (!session?.tokens?.accessToken) return null;
    
    // Check if token is expired
    if (isTokenExpired(session.tokens.expiresAt)) {
      return null;
    }
    
    return session.tokens.accessToken;
  };

  const getRefreshToken = (): string | null => {
    return session?.tokens?.refreshToken || null;
  };

  const isAuthenticated = (): boolean => {
    return !!getAccessToken();
  };

  const needsRefresh = (): boolean => {
    if (!session?.tokens?.expiresAt) return false;
    
    // Consider token needs refresh if it expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return session.tokens.expiresAt <= fiveMinutesFromNow;
  };

  return {
    // Data
    session,
    isLoading,
    
    // Actions
    setSession,
    clearSession,
    updateTokens,
    
    // Getters
    getAccessToken,
    getRefreshToken,
    isAuthenticated,
    needsRefresh,

    authenticatedFetch,
    
    // Mutation states
    isSettingSession: setSessionMutation.isPending,
    isClearingSession: clearSessionMutation.isPending,
    isUpdatingTokens: updateTokensMutation.isPending,
  };
} 