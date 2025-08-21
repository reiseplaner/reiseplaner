import { ClipboardCheck, User, Loader2, RefreshCw, Bug } from "lucide-react";
import { useLocation } from "wouter";
import ProfileDropdown from "@/components/ProfileDropdown";
import SupportDialog from "@/components/SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, dbUser, forceSignOut, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Debug logging
  console.log('🔍 Navigation Debug:', { 
    user: !!user, 
    dbUser: !!dbUser,
    isAuthenticated, 
    isLoading,
    userDetails: user ? { id: user.id, email: user.email } : null
  });

  // Show a loading placeholder when user is authenticated but dbUser is not yet loaded
  const showLoadingProfile = user && !dbUser && !isLoading;

  const handleRefreshProfile = () => {
    console.log('🔄 Refreshing user profile data');
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };

  const handleDebugAuth = async () => {
    console.log('🐛 STARTING AUTH DIAGNOSTICS');
    console.log('==================================');
    
    try {
      // 1. Check Supabase session
      console.log('🔍 Step 1: Checking Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📊 Session:', session ? 'EXISTS' : 'MISSING');
      console.log('📊 Session error:', sessionError);
      console.log('📊 User ID:', session?.user?.id);
      console.log('📊 User email:', session?.user?.email);
      console.log('📊 Access token:', session?.access_token ? 'EXISTS' : 'MISSING');
      console.log('📊 Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
      
      if (!session) {
        console.log('❌ No session found - user needs to log in again');
        alert('Keine aktive Sitzung gefunden. Bitte melden Sie sich erneut an.');
        return;
      }
      
      // 2. Test API request directly
      console.log('🔍 Step 2: Testing API request...');
      const response = await apiRequest("GET", "/api/auth/user");
      console.log('📊 API Response status:', response.status);
      console.log('📊 API Response ok:', response.ok);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📊 API Response data:', userData);
        console.log('✅ API request successful!');
        
        // Force refresh the query
        queryClient.setQueryData(['/api/auth/user'], userData);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
        alert('✅ API-Aufruf erfolgreich! Das Profil sollte jetzt angezeigt werden.');
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', errorText);
        alert(`❌ API-Fehler: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.error('🔴 Debug error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ Debug-Fehler: ${errorMessage}`);
    }
    
    console.log('==================================');
    console.log('🐛 AUTH DIAGNOSTICS COMPLETE');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="flex justify-center">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <ClipboardCheck className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-slate-900">ReiseVeteran</span>
            </div>
            <div className="flex space-x-6 ml-8">
              <button
                onClick={() => setLocation("/")}
                className={`text-sm font-medium transition-colors ${
                  location === "/" 
                    ? "text-primary" 
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setLocation("/community")}
                className={`text-sm font-medium transition-colors ${
                  location === "/community" 
                    ? "text-primary" 
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                Community
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <SupportDialog />
            
            {/* Show loading state when user is authenticated but dbUser is loading */}
            {showLoadingProfile ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-600">Lade Profil...</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefreshProfile}
                  className="h-8 w-8 p-0"
                  title="Profil aktualisieren"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDebugAuth}
                  className="h-8 w-8 p-0"
                  title="Authentifizierung diagnostizieren"
                >
                  <Bug className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <ProfileDropdown />
            )}
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
}
