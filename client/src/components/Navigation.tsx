import { MapPin, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
