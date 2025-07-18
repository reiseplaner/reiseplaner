import { apiRequest } from '@/lib/queryClient';

export interface LocalAuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  subscriptionStatus?: string;
}

export interface AuthResponse {
  user: LocalAuthUser;
  access_token: string;
  success: boolean;
}

export const localAuth = {
  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/local/signin", {
      email,
      password
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Anmeldung fehlgeschlagen');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    
    return data;
  },

  async signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/local/signup", {
      email,
      password
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registrierung fehlgeschlagen');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    
    return data;
  },

  async signInWithDemo(): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/local/demo");
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Demo-Anmeldung fehlgeschlagen');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    
    return data;
  },

  async getCurrentUser(): Promise<LocalAuthUser | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token might be expired, clear it
        localStorage.removeItem('auth_token');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      localStorage.removeItem('auth_token');
      return null;
    }
  },

  signOut(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username-setup-skipped');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
};