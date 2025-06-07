import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Heart, MapPin, Calendar, Users, Plane, Mountain, Building } from "lucide-react";
import type { Trip } from "@shared/schema";

// Extended trip type with upvote count
type TripWithUpvotes = Trip & { 
  upvoteCount: number;
  user?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

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

  const getDestinationInfo = (destination: string) => {
    const destinationMap: { [key: string]: { icon: any } } = {
      "DPS": { icon: Mountain }, // Bali
      "NRT": { icon: Mountain }, // Japan
      "KEF": { icon: Mountain }, // Iceland
      "ATH": { icon: Building }, // Greece
      "CDG": { icon: Building }, // Paris
      "NYC": { icon: Building }, // New York
      "LON": { icon: Building }, // London
      "ROM": { icon: Building }, // Rom
      "BCN": { icon: Building }, // Barcelona
      "AMS": { icon: Building }, // Amsterdam
    };
    
    const defaultDestination = { icon: Plane };
    return destinationMap[destination || ""] || defaultDestination;
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
            {publicTrips.map((trip) => {
              const destinationInfo = getDestinationInfo(trip.destination || "");
              const IconComponent = destinationInfo.icon;
              
              return (
                <Card 
                  key={trip.id} 
                  className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white/80 backdrop-blur-sm"
                  onClick={() => handleTripClick(trip)}
                >
                  <CardContent className="p-6 relative">
                    {/* Header mit Icon und Destination */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>
                        {trip.destination && (
                          <div className="text-gray-700 font-medium bg-slate-100 px-3 py-1 rounded-full text-sm">
                            {trip.destination}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Heart className="h-4 w-4 mr-1" />
                        <span>{trip.upvoteCount || 0}</span>
                      </div>
                    </div>

                    {/* Trip Name */}
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                        {trip.name}
                      </h3>
                    </div>
                    
                    {trip.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{trip.description}</p>
                    )}
                    
                    {/* Trip Details */}
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{trip.travelers} Personen</span>
                      </div>
                      
                      {trip.totalBudget && (
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-emerald-100 rounded-lg">
                            <span className="text-emerald-600 font-bold text-xs">€</span>
                          </div>
                          <span className="font-medium">€{parseFloat(trip.totalBudget).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Author und Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mr-2 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {(trip.user?.username?.[0] || trip.user?.firstName?.[0] || "A").toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {trip.user?.username || 
                           (trip.user?.firstName && trip.user?.lastName ? 
                             `${trip.user.firstName} ${trip.user.lastName}` : 
                             "Anonymer Benutzer")}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
