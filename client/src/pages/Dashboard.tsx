import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Compass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import TripCard from "@/components/TripCard";
import UpgradePrompt from "@/components/UpgradePrompt";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Trip } from "@shared/schema";
import { useState } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { forceSignOut, isAuthenticated, user } = useAuth();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Simple reset function that clears everything and redirects
  const handleEmergencyReset = () => {
    console.log('🚨 Emergency reset triggered');
    
    // Show confirmation
    if (!confirm('Möchten Sie wirklich alle Authentifizierungsdaten zurücksetzen und zur Anmeldeseite wechseln?')) {
      return;
    }
    
    try {
      // Clear all local and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear query cache
      queryClient.clear();
      
      // Force a complete page reload to reset all state
      window.location.replace('/');
    } catch (error) {
      console.error('Error during reset:', error);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: publicTrips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/public/trips"],
    retry: false,
  });

  const { data: subscriptionInfo } = useQuery({
    queryKey: ["/api/user/subscription"],
    retry: false,
  });

  const createTripMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/trips", {
        name: "Neue Reise",
        totalBudget: "1000",
        travelers: 2,
      });
      return response.json();
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/subscription"] });
      setLocation(`/trip-planning/${newTrip.id}`);
      toast({
        title: "Reise erstellt",
        description: "Deine neue Reise wurde erfolgreich erstellt.",
      });
    },
    onError: (error: any) => {
      console.error('Trip creation error:', error);
      
      // Check if it's a limit reached error
      if (error.message?.includes('403') || error.message?.includes('Limit')) {
        setShowUpgradePrompt(true);
      } else {
        toast({
          title: "Fehler",
          description: "Die Reise konnte nicht erstellt werden.",
          variant: "destructive",
        });
      }
    },
  });

  const copyTripMutation = useMutation({
    mutationFn: async (publicTrip: Trip) => {
      const response = await apiRequest("POST", "/api/trips", {
        name: `${publicTrip.name} (Kopie)`,
        departure: publicTrip.departure,
        destination: publicTrip.destination,
        totalBudget: publicTrip.totalBudget,
        travelers: publicTrip.travelers,
        description: publicTrip.description,
      });
      return response.json();
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation(`/trip-planning/${newTrip.id}`);
      toast({
        title: "Reise kopiert",
        description: "Die Reise wurde erfolgreich zu deinem Account hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Reise konnte nicht kopiert werden.",
        variant: "destructive",
      });
    },
  });

  if (tripsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 space-y-4">
                  <div className="h-32 bg-slate-200 rounded-lg"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Emergency reset button if auth is broken */}
      {!user && (
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={handleEmergencyReset}
            className="bg-red-600 text-white hover:bg-red-700 shadow-lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Notfall-Reset
          </Button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meine Reisen</h1>
            <p className="text-slate-600 mt-1">
              Verwalte und plane deine Reisen
              {!user && (
                <span className="ml-4">
                  <button 
                    onClick={handleEmergencyReset}
                    className="text-red-600 underline hover:text-red-800"
                  >
                    → Authentifizierung zurücksetzen
                  </button>
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => createTripMutation.mutate()}
            disabled={createTripMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Reise starten
          </Button>
        </div>

        {/* Trip Cards */}
        {trips.length === 0 ? (
          <Card className="mb-12">
            <CardContent className="py-12 text-center">
              <div className="text-slate-400 mb-4">
                <Plus className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Noch keine Reisen geplant
              </h3>
              <p className="text-slate-600 mb-6">
                Erstelle deine erste Reise und beginne mit der Planung.
              </p>
              <Button 
                onClick={() => createTripMutation.mutate()}
                disabled={createTripMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Erste Reise erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {/* Community Inspiration */}
        {publicTrips.length > 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                    <Compass className="h-6 w-6 mr-3 text-primary" />
                    Inspiration aus der Community
                  </h2>
                  <p className="text-slate-600 mt-1">Entdecke Reisepläne anderer Nutzer</p>
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => setLocation("/community")}
                  className="text-primary hover:text-primary/90"
                >
                  Alle ansehen →
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicTrips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img 
                      src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150" 
                      alt="Travel destination" 
                      className="w-full h-24 object-cover rounded mb-3" 
                    />
                    <h4 className="font-semibold text-slate-900 mb-1">{trip.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {trip.destination} • {trip.travelers} Personen
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Öffentlicher Plan</span>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => copyTripMutation.mutate(trip)}
                        disabled={copyTripMutation.isPending}
                        className="text-primary hover:text-primary/90"
                      >
                        Kopieren
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upgrade Prompt */}
      {subscriptionInfo && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          currentPlan={subscriptionInfo.status}
          tripsUsed={subscriptionInfo.tripsUsed}
          tripsLimit={subscriptionInfo.tripsLimit}
        />
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
