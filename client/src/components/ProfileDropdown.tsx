import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  LogOut, 
  Crown,
  ChevronDown,
  Sparkles
} from "lucide-react";

interface SubscriptionInfo {
  status: 'free' | 'pro' | 'veteran';
  tripsUsed: number;
  tripsLimit: number;
  canExport: boolean;
}

export default function ProfileDropdown() {
  const { user, dbUser, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [cachedProfileImageUrl, setCachedProfileImageUrl] = useState<string | null>(null);

  const { data: subscriptionInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/user/subscription"],
    retry: false,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Additional query to get the correct profile image
  const { data: profileImageData } = useQuery<{ profileImageUrl: string | null; hasProfileImage: boolean }>({
    queryKey: ['/api/auth/profile-image'],
    enabled: !!dbUser && !cachedProfileImageUrl,
    retry: false,
  });

  // Load cached profile image from localStorage
  useEffect(() => {
    if (dbUser?.id && !cachedProfileImageUrl) {
      const cachedUrl = localStorage.getItem(`profileImage_${dbUser.id}`);
      if (cachedUrl) {
        console.log('💾 ProfileDropdown: Loading cached profile image from localStorage:', cachedUrl);
        setCachedProfileImageUrl(cachedUrl);
      }
    }
  }, [dbUser?.id, cachedProfileImageUrl]);

  // Listen for localStorage changes (when profile image is updated in other components)
  useEffect(() => {
    const handleProfileImageUpdate = (e: CustomEvent) => {
      const { userId, imageUrl } = e.detail;
      if (userId === dbUser?.id) {
        console.log('💾 ProfileDropdown: Detected profile image update via custom event:', imageUrl);
        setCachedProfileImageUrl(imageUrl);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    return () => window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
  }, [dbUser?.id]);

  // Helper function to get proper image URL
  const getImageUrl = (profileImageUrl: string | null | undefined): string => {
    // Priority order: 1. Cache, 2. API response, 3. dbUser, 4. empty
    const bestUrl = cachedProfileImageUrl || 
                   profileImageData?.profileImageUrl || 
                   profileImageUrl || 
                   "";
    
    if (!bestUrl) return "";
    
    // If already absolute URL, return as is
    if (bestUrl.startsWith('http')) {
      return bestUrl;
    }
    
    // Convert relative URL to absolute
    return `${window.location.origin}${bestUrl}`;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleProfileClick = () => {
    setLocation("/profile");
    setIsOpen(false);
  };

  const handleUpgradeClick = () => {
    setLocation("/pricing");
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Enhanced debugging
  console.log('🔍 ProfileDropdown Debug:', {
    user: !!user,
    userEmail: user?.email,
    dbUser: !!dbUser,
    dbUserDetails: dbUser ? {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      username: dbUser.username
    } : null
  });

  if (!user || !dbUser) {
    console.log('🔍 ProfileDropdown: Not rendering because user or dbUser is missing', {
      hasUser: !!user,
      hasDbUser: !!dbUser
    });
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-auto px-2 rounded-full hover:bg-slate-100"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={getImageUrl(dbUser.profileImageUrl) || ""} 
                alt={`${dbUser.firstName} ${dbUser.lastName}`} 
                onError={(e) => {
                  console.error('🔴 ProfileDropdown: Profilbild konnte nicht geladen werden:', dbUser.profileImageUrl);
                  console.error('🔴 ProfileDropdown: Cache:', cachedProfileImageUrl);
                  console.error('🔴 ProfileDropdown: API:', profileImageData?.profileImageUrl);
                }}
                onLoad={() => {
                  console.log('✅ ProfileDropdown: Profilbild erfolgreich geladen');
                  console.log('✅ ProfileDropdown: Cache:', cachedProfileImageUrl);
                  console.log('✅ ProfileDropdown: API:', profileImageData?.profileImageUrl);
                  console.log('✅ ProfileDropdown: dbUser:', dbUser.profileImageUrl);
                }}
              />
              <AvatarFallback className="text-sm">
                {getInitials(dbUser.firstName, dbUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-slate-900">
                {dbUser.firstName} {dbUser.lastName}
              </span>
              <span className="text-xs text-slate-500">
                @{dbUser.username || "Kein Username"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {dbUser.firstName} {dbUser.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {dbUser.username && (
              <p className="text-xs leading-none text-muted-foreground">
                @{dbUser.username}
              </p>
            )}
            {subscriptionInfo && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={subscriptionInfo.status === 'free' ? 'outline' : 'default'} className="text-xs">
                  {subscriptionInfo.status === 'free' && <Sparkles className="w-3 h-3 mr-1" />}
                  {subscriptionInfo.status === 'pro' && <Crown className="w-3 h-3 mr-1" />}
                  {subscriptionInfo.status === 'veteran' && <Crown className="w-3 h-3 mr-1" />}
                  {subscriptionInfo.status === 'free' ? 'Standard' : 
                   subscriptionInfo.status === 'pro' ? 'Pro Plan' : 'Veteran Plan'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {subscriptionInfo.tripsUsed}/{subscriptionInfo.tripsLimit === Infinity ? '∞' : subscriptionInfo.tripsLimit} Reisen
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Mein Profil</span>
        </DropdownMenuItem>
        
        {subscriptionInfo?.status === 'free' && (
          <DropdownMenuItem onClick={handleUpgradeClick} className="cursor-pointer">
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade zu Premium</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 