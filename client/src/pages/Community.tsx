import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Heart } from "lucide-react";
import type { Trip } from "@shared/schema";

// Extended trip type with upvote count
type TripWithUpvotes = Trip & { upvoteCount: number };

export default function Community() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: publicTrips = [], isLoading } = useQuery({
    queryKey: ["/api/public/trips"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/trips");
      return response.json() as Promise<TripWithUpvotes[]>;
    },
  });

  const copyTripMutation = useMutation({
    mutationFn: async (publicTrip: TripWithUpvotes) => {
      const response = await apiRequest("POST", "/api/trips", {
        name: `${publicTrip.name} (Kopie)`,
        departure: publicTrip.departure,
        destination: publicTrip.destination,
        startDate: publicTrip.startDate,
        endDate: publicTrip.endDate,
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

  const getDestinationImage = (destination: string) => {
    // Map destinations to appropriate stock images
    const imageMap: { [key: string]: string } = {
      "DPS": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Bali
      "NRT": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Japan
      "KEF": "https://images.unsplash.com/photo-1682686581264-c47e25e61d95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Iceland
      "ATH": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Greece
    };
    return imageMap[destination || ""] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
  };

  const handleTripClick = (trip: TripWithUpvotes) => {
    if (trip.publicSlug) {
      setLocation(`/community/${trip.publicSlug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community-Reisepläne</h1>
          <p className="text-slate-600">Entdecke Inspiration von anderen Reisenden und teile deine eigenen Pläne</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zielort</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Ziele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Ziele</SelectItem>
                    <SelectItem value="asia">Asien</SelectItem>
                    <SelectItem value="europe">Europa</SelectItem>
                    <SelectItem value="america">Amerika</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dauer</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Dauern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Dauern</SelectItem>
                    <SelectItem value="short">1-7 Tage</SelectItem>
                    <SelectItem value="medium">1-2 Wochen</SelectItem>
                    <SelectItem value="long">2+ Wochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Budget</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Budgets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Budgets</SelectItem>
                    <SelectItem value="low">{'<'} €1.000</SelectItem>
                    <SelectItem value="medium">€1.000 - €3.000</SelectItem>
                    <SelectItem value="high">{'>'} €3.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sortierung</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Neueste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Neueste</SelectItem>
                    <SelectItem value="popular">Beliebteste</SelectItem>
                    <SelectItem value="rating">Bewertung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Trip Cards */}
        {publicTrips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-slate-400 mb-4">
                <Heart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Noch keine öffentlichen Reisen
              </h3>
              <p className="text-slate-600">
                Sei der Erste und teile deine Reisepläne mit der Community!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTrips.map((trip) => (
              <Card 
                key={trip.id} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTripClick(trip)}
              >
                <img 
                  src={getDestinationImage(trip.destination || "")}
                  alt="Travel destination" 
                  className="w-full h-48 object-cover" 
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">{trip.name}</h3>
                    <div className="flex items-center text-sm text-slate-500">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>{trip.upvoteCount || 0}</span>
                    </div>
                  </div>
                  
                  {trip.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{trip.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-slate-500 mb-4">
                    <span>{trip.destination || "Unbekannt"}</span>
                    {trip.totalBudget && (
                      <span>€{parseFloat(trip.totalBudget).toLocaleString()}</span>
                    )}
                    <span>{trip.travelers} Personen</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-300 rounded-full mr-2"></div>
                      <span className="text-sm text-slate-600">Öffentlicher Plan</span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when copying
                        copyTripMutation.mutate(trip);
                      }}
                      disabled={copyTripMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      Kopieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
