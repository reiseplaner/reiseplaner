import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { localAuth, type LocalAuthUser } from '@/lib/localAuth';
import { useLocation } from 'wouter';

export function useLocalAuth() {
  const [user, setUser] = useState<LocalAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameSetupSkipped, setUsernameSetupSkipped] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check if username setup was skipped
  useEffect(() => {
    const skipped = localStorage.getItem('username-setup-skipped');
    setUsernameSetupSkipped(skipped === 'true');
  }, []);

  // Get current user
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localAuth.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Update user state when query data changes
  useEffect(() => {
    setUser(currentUser || null);
    setIsLoading(isUserLoading);
  }, [currentUser, isUserLoading]);

  // Get database user info (for compatibility with existing code)
  const { data: dbUser, isLoading: isLoadingDbUser } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const token = localAuth.getToken();
      if (!token) return null;

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await localAuth.signInWithEmail(email, password);
      setUser(result.user);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await localAuth.signUpWithEmail(email, password);
      setUser(result.user);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signInWithDemo = async () => {
    try {
      const result = await localAuth.signInWithDemo();
      setUser(result.user);
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      return result;
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    // For now, redirect to demo login
    return await signInWithDemo();
  };

  const signOut = async () => {
    localAuth.signOut();
    setUser(null);
    setUsernameSetupSkipped(false);
    await queryClient.clear();
    setLocation('/');
  };

  const forceSignOut = async () => {
    console.log('🔧 Force signing out - clearing all local auth data');
    localAuth.signOut();
    setUser(null);
    setUsernameSetupSkipped(false);
    await queryClient.clear();
    window.location.reload();
  };

  const skipUsernameSetup = () => {
    localStorage.setItem('username-setup-skipped', 'true');
    setUsernameSetupSkipped(true);
  };

  // Check if user needs to set username
  const needsUsername = user && (!dbUser || (dbUser && !dbUser.username)) && !usernameSetupSkipped;

  return {
    user,
    dbUser,
    isLoading: isLoading || isLoadingDbUser,
    isAuthenticated: !!user,
    needsUsername,
    skipUsernameSetup,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithDemo,
    signOut,
    forceSignOut,
  };
}