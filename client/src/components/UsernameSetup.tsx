import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Loader2, ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface UsernameSetupProps {
  onComplete: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { skipUsernameSetup, forceSignOut } = useAuth();
  const queryClient = useQueryClient();

  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Check username availability
  const { data: availabilityData, isLoading: checkingAvailability } = useQuery({
    queryKey: ["/api/auth/username", debouncedUsername, "available"],
    queryFn: async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) return null;
      
      console.log(`🔍 Checking username availability: ${debouncedUsername}`);
      
      try {
        const response = await fetch(`/api/auth/username/${debouncedUsername}/available`);
        console.log(`🔍 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`🔴 Error response:`, errorText);
          // If API fails, assume username is available for now
          return { available: true };
        }
        
        const data = await response.json();
        console.log(`🔍 Availability data:`, data);
        return data;
      } catch (error) {
        console.error(`🔴 Username availability check failed:`, error);
        // If API fails, assume username is available for now
        return { available: true };
      }
    },
    enabled: !!debouncedUsername && debouncedUsername.length >= 3,
    retry: false,
  });

  // Set username mutation
  const setUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      console.log(`🔧 Setting username: ${username}`);
      
      try {
        const response = await apiRequest("POST", "/api/auth/username", { username });
        console.log(`🔧 Set username response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`🔴 Username API error:`, errorText);
          throw new Error(`Fehler beim Setzen des Usernames: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`🔧 Set username response data:`, data);
        return data;
      } catch (error) {
        console.error(`🔴 Set username failed:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`✅ Username set successfully:`, data);
      toast({
        title: "Username gesetzt!",
        description: "Dein Username wurde erfolgreich eingerichtet.",
      });
      
      // Invalidate user query to refetch updated user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Small delay to ensure query invalidation completes and then complete
      setTimeout(() => {
        console.log('🔧 Username setup completing...');
        onComplete();
      }, 500);
    },
    onError: (error: any) => {
      console.error(`🔴 Username setting error:`, error);
      toast({
        title: "Fehler beim Username setzen",
        description: error.message || "Username konnte nicht gesetzt werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.length < 3) {
      toast({
        title: "Ungültiger Username",
        description: "Username muss mindestens 3 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast({
        title: "Ungültiger Username",
        description: "Username darf nur Buchstaben, Zahlen, _ und - enthalten.",
        variant: "destructive",
      });
      return;
    }

    if (!availabilityData?.available) {
      toast({
        title: "Username nicht verfügbar",
        description: "Bitte wähle einen anderen Username.",
        variant: "destructive",
      });
      return;
    }

    setUsernameMutation.mutate(username);
  };

  const handleSkip = () => {
    toast({
      title: "Username übersprungen",
      description: "Du kannst deinen Username später in den Einstellungen setzen.",
    });
    skipUsernameSetup();
    setLocation("/");
  };

  const getInputStatus = () => {
    if (!debouncedUsername || debouncedUsername.length < 3) return null;
    if (checkingAvailability) return "checking";
    if (availabilityData?.available) return "available";
    return "unavailable";
  };

  const inputStatus = getInputStatus();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center cursor-pointer" onClick={handleSkip}>
                <MapPin className="h-6 w-6 text-primary mr-2" />
                <span className="text-lg font-bold text-slate-900">ReiseVeteran</span>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center p-4 pt-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Willkommen bei ReiseVeteran!</CardTitle>
            <p className="text-slate-600">
              Bitte wähle einen Username, um mit der Community zu interagieren.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="dein_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className={`pr-10 ${
                      inputStatus === "available" 
                        ? "border-green-500 focus:border-green-500" 
                        : inputStatus === "unavailable" 
                        ? "border-red-500 focus:border-red-500" 
                        : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {inputStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                    {inputStatus === "available" && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {inputStatus === "unavailable" && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {availabilityData && !availabilityData.available && (
                  <p className="text-sm text-red-600">
                    {availabilityData.message || "Username ist bereits vergeben"}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Mindestens 3 Zeichen, nur Buchstaben, Zahlen, _ und -
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !username || 
                    username.length < 3 || 
                    inputStatus !== "available" || 
                    setUsernameMutation.isPending
                  }
                >
                  {setUsernameMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Username wird gesetzt...
                    </>
                  ) : (
                    "Username bestätigen"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSkip}
                >
                  Später einrichten
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 