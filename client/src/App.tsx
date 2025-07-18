import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import TripPlanning from "@/pages/TripPlanning";
import Community from "@/pages/Community";
import PublicTripDetail from "@/pages/PublicTripDetail";
import Profile from "@/pages/Profile";
import PricingPage from "@/pages/PricingPage";
import Impressum from "@/pages/Impressum";
import Datenschutz from "@/pages/Datenschutz";
import CookieEinstellungen from "@/pages/CookieEinstellungen";
import UsernameSetup from "@/components/UsernameSetup";
import NotFound from "@/pages/not-found";
import { CookieProvider } from "@/contexts/CookieContext";
import CookieBanner from "@/components/CookieBanner";
import { useState } from "react";

function Router() {
  const { isAuthenticated, isLoading, needsUsername } = useLocalAuth();
  const [usernameSetupCompleted, setUsernameSetupCompleted] = useState(false);

  console.log('🔍 Router State:', { isAuthenticated, isLoading, needsUsername, usernameSetupCompleted });

  // Show loading only for initial auth check
  if (isLoading) {
    console.log('🔍 Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  // Show username setup if user is authenticated but doesn't have a username
  if (isAuthenticated && needsUsername && !usernameSetupCompleted) {
    console.log('🔍 Showing username setup');
    return (
      <UsernameSetup 
        onComplete={() => {
          console.log('🔍 Username setup completed');
          setUsernameSetupCompleted(true);
          // Force a re-render by invalidating the auth query
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        }} 
      />
    );
  }

  console.log('🔍 Showing main routes, authenticated:', isAuthenticated);

  return (
    <>
      <Switch>
        {/* Public routes - accessible to everyone */}
        <Route path="/community/:slug" component={PublicTripDetail} />
        <Route path="/impressum" component={Impressum} />
        <Route path="/datenschutz" component={Datenschutz} />
        <Route path="/cookie-einstellungen" component={CookieEinstellungen} />
        
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/trip-planning/:id" component={TripPlanning} />
            <Route path="/community" component={Community} />
            <Route path="/profile" component={Profile} />
            <Route path="/pricing" component={PricingPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CookieProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CookieProvider>
    </QueryClientProvider>
  );
}

export default App;
