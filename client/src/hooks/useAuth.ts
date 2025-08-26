import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User as DbUser } from '@shared/schema';
import { useLocation } from 'wouter';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameSetupSkipped, setUsernameSetupSkipped] = useState(false);
  const [dbUserLoadingTimeout, setDbUserLoadingTimeout] = useState(false);
  const [, setLocation] = useLocation();

  // Check if username setup was skipped
  useEffect(() => {
    const skipped = localStorage.getItem('username-setup-skipped');
    setUsernameSetupSkipped(skipped === 'true');
  }, []);

  // Get database user info
  const { data: dbUser, isLoading: isLoadingDbUser, error: dbUserError } = useQuery<DbUser>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      console.log('🔍 useAuth: Starting database user fetch...');
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        console.log('🔍 useAuth: API response status:', response.status);
        
        if (!response.ok) {
          console.error('🔴 useAuth: API response not ok:', response.status, response.statusText);
          const text = await response.text();
          console.error('🔴 useAuth: Error response body:', text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        
        const userData = await response.json();
        console.log('🔍 useAuth: Received user data:', userData);
        return userData;
      } catch (error) {
        console.error('🔴 useAuth: Failed to fetch database user:', error);
        throw error; // Throw error to trigger retry logic
      }
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      console.log(`🔄 useAuth: Retry attempt ${failureCount}, error:`, error);
      return failureCount < 2; // Retry up to 2 times
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Add query timeout
    meta: {
      errorMessage: 'Benutzer konnte nicht geladen werden'
    }
  });

  // Timeout for database user loading
  useEffect(() => {
    if (user && !dbUser && isLoadingDbUser && !dbUserError) {
      const timeout = setTimeout(() => {
        console.warn('Database user loading timed out after 3 seconds - assuming new user needs username');
        setDbUserLoadingTimeout(true);
      }, 3000); // 3 seconds timeout for faster UX

      return () => clearTimeout(timeout);
    } else {
      // Reset timeout if conditions change
      setDbUserLoadingTimeout(false);
    }
  }, [user, dbUser, isLoadingDbUser, dbUserError]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Sign in response:', { data, error });
    if (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
    return data;
  };

  const signUpWithEmail = async (email: string, password: string, username?: string) => {
    console.log('Attempting to sign up with email:', email, 'username:', username);
    
    // If username is provided, check availability first
    if (username) {
      try {
        const response = await fetch(`/api/auth/username/${username}/available`);
        if (response.ok) {
          const data = await response.json();
          if (!data.available) {
            throw new Error('Username ist bereits vergeben. Bitte wähle einen anderen.');
          }
        }
      } catch (error: any) {
        console.error('Username availability check failed:', error);
        if (error.message.includes('vergeben')) {
          throw error;
        }
        // Continue if check fails (assume available)
      }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || null
        }
      }
    });
    console.log('Sign up response:', { data, error });
    if (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    // Clear the skipped flag on logout
    localStorage.removeItem('username-setup-skipped');
    setUsernameSetupSkipped(false);
    
    // Navigate to landing page after logout
    setLocation('/');
  };

  const forceSignOut = async () => {
    console.log('🔧 Force signing out - clearing all local auth data');
    
    // Clear all local storage
    localStorage.removeItem('username-setup-skipped');
    localStorage.removeItem('supabase.auth.token');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Force reload the page to reset all state
    window.location.reload();
  };

  const skipUsernameSetup = () => {
    localStorage.setItem('username-setup-skipped', 'true');
    setUsernameSetupSkipped(true);
  };

  // Username setup is no longer needed since we require it during registration
  // Only show for existing users who registered before this change
  const needsUsername = user && 
    !usernameSetupSkipped && 
    dbUser && !dbUser.username; // Only existing users without username

  // Only show loading for initial auth check
  const isAuthLoading = isLoading;
  // Show loading for database user only if actively loading, not timed out, and not errored
  const isDbUserLoading = user && isLoadingDbUser && !dbUserError && !dbUserLoadingTimeout;
  
  // Combined loading state - only show loading if we're actually loading something important
  const finalIsLoading = isAuthLoading || (isDbUserLoading && !needsUsername);

  // Debug logging
  console.log('🔍 useAuth state:', {
    user: !!user,
    dbUser: !!dbUser,
    isAuthLoading,
    isDbUserLoading,
    finalIsLoading,
    needsUsername,
    usernameSetupSkipped,
    dbUserError: !!dbUserError,
    dbUserLoadingTimeout
  });

  return {
    user,
    dbUser,
    isLoading: finalIsLoading,
    isAuthenticated: !!user,
    needsUsername,
    skipUsernameSetup,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    forceSignOut,
  };
}
