import { MapPin } from "lucide-react";
import { useLocation } from "wouter";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, forceSignOut, isAuthenticated, isLoading } = useAuth();

  // Debug logging
  console.log('🔍 Navigation Debug:', { 
    user: !!user, 
    isAuthenticated, 
    isLoading,
    userDetails: user ? { id: user.id, email: user.email } : null
  });

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <MapPin className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-slate-900">ReiseVeteran</span>
            </div>
            <div className="hidden md:flex space-x-6 ml-8">
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
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
