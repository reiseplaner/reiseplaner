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
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Failed to fetch database user:', error);
        // Return null instead of throwing to prevent endless loading
        return null;
      }
    },
    enabled: !!user,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Add timeout to prevent endless loading
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Timeout for database user loading
  useEffect(() => {
    if (user && !dbUser && isLoadingDbUser && !dbUserError) {
      const timeout = setTimeout(() => {
        console.warn('Database user loading timed out after 10 seconds');
        setDbUserLoadingTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
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

  const signUpWithEmail = async (email: string, password: string) => {
    console.log('Attempting to sign up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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

  // Check if user needs to set username
  // Only show username setup if user is authenticated, has no username, and hasn't skipped setup
  const needsUsername = user && (!dbUser || (dbUser && !dbUser.username)) && !usernameSetupSkipped;

  // Only show loading for initial auth check, not for database user fetch
  const isAuthLoading = isLoading;
  // Don't show loading for database user if there's an error, timeout, or if it's taking too long
  const isDbUserLoading = user && isLoadingDbUser && !dbUserError && !dbUserLoadingTimeout;

  return {
    user,
    dbUser,
    isLoading: isAuthLoading || isDbUserLoading,
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
