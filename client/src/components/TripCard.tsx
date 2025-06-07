import { Edit, Trash2, MapPin, Calendar, Users, Euro, Plane, Mountain, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Trip, TripWithDetails } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Lade die vollständigen Trip-Details mit Budget-Items
  const { data: tripDetails } = useQuery<any>({
    queryKey: ["/api/trips", trip.id.toString()],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trips/${trip.id}`);
      return response.json();
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/trips/${trip.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Reise gelöscht",
        description: "Die Reise wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Reise konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const getDestinationInfo = (destination: string) => {
    const destinationMap: { [key: string]: { icon: any } } = {
      "DPS": { icon: Mountain }, // Bali
      "NRT": { icon: Mountain }, // Japan
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

  const formatDateRange = () => {
    if (!trip.startDate || !trip.endDate) return "Datum nicht festgelegt";
    const start = new Date(trip.startDate).toLocaleDateString("de-DE");
    const end = new Date(trip.endDate).toLocaleDateString("de-DE");
    return `${start} - ${end}`;
  };

  const calculateBudgetInfo = () => {
    const totalBudget = parseFloat(trip.totalBudget || "0");
    
    console.log("🔍 TripCard Budget Debug für Trip:", trip.id);
    console.log("🔍 tripDetails:", tripDetails);
    console.log("🔍 totalBudget:", totalBudget);
    
    if (!tripDetails || totalBudget === 0) {
      console.log("🔍 Keine tripDetails oder totalBudget = 0");
      return {
        totalBudget,
        plannedBudget: 0,
        remainingBudget: totalBudget,
        percentage: 0
      };
    }

    // Handle both array and object structures for tripDetails
    let actualTripDetails: any;
    if (Array.isArray(tripDetails)) {
      actualTripDetails = tripDetails[0];
      console.log("🔍 tripDetails ist Array, nehme [0]:", actualTripDetails);
    } else if ((tripDetails as any)["0"]) {
      actualTripDetails = (tripDetails as any)["0"];
      console.log("🔍 tripDetails hat '0' key, nehme ['0']:", actualTripDetails);
    } else {
      actualTripDetails = tripDetails;
      console.log("🔍 tripDetails ist normales Objekt:", actualTripDetails);
    }

    const budgetItems = actualTripDetails?.budgetItems || tripDetails?.budgetItems || [];
    console.log("🔍 budgetItems gefunden:", budgetItems);
    console.log("🔍 budgetItems Anzahl:", budgetItems.length);
    
    const plannedBudget = budgetItems.reduce((sum: number, item: any) => {
      const amount = parseFloat(item.totalPrice || "0");
      console.log("🔍 Budget Item:", item.subcategory, "totalPrice:", amount);
      return sum + amount;
    }, 0);
    
    console.log("🔍 Berechnetes plannedBudget:", plannedBudget);
    
    const remainingBudget = totalBudget - plannedBudget;
    const percentage = totalBudget > 0 ? Math.min((plannedBudget / totalBudget) * 100, 100) : 0;
    
    console.log("🔍 remainingBudget:", remainingBudget);
    console.log("🔍 percentage:", percentage);
    
    return {
      totalBudget,
      plannedBudget,
      remainingBudget,
      percentage: Math.round(percentage)
    };
  };

  const budgetInfo = calculateBudgetInfo();
  const destinationInfo = getDestinationInfo(trip.destination || "");
  const IconComponent = destinationInfo.icon;

  return (
    <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white/80 backdrop-blur-sm">
      <div onClick={() => setLocation(`/trip-planning/${trip.id}`)}>
        <CardContent className="p-6 relative">
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/trip-planning/${trip.id}`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reise löschen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bist du sicher, dass du die Reise "{trip.name}" löschen möchtest? 
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteTripMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Trip Name */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
              {trip.name}
            </h3>
          </div>
          
          {/* Trip Details */}
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium">{formatDateRange()}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-medium">{trip.travelers} Personen</span>
            </div>
            
            {trip.departure && trip.destination && (
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">{trip.departure} → {trip.destination}</span>
              </div>
            )}
          </div>
          
          {/* Budget Section - Moderneres Design */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Euro className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Gesamtbudget</span>
              </div>
              <span className="font-bold text-lg text-gray-900">
                {budgetInfo.totalBudget > 0 ? `€${budgetInfo.totalBudget.toLocaleString()}` : "Nicht festgelegt"}
              </span>
            </div>
            
            {budgetInfo.totalBudget > 0 && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">
                    Verplant: €{budgetInfo.plannedBudget.toLocaleString()}
                  </span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                    Verbleibend: €{budgetInfo.remainingBudget.toLocaleString()}
                  </span>
                </div>
                
                {/* Moderner Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${
                      budgetInfo.percentage > 80 
                        ? 'from-red-400 to-red-500' 
                        : budgetInfo.percentage > 60 
                        ? 'from-yellow-400 to-orange-500' 
                        : 'from-green-400 to-emerald-500'
                    }`}
                    style={{ width: `${budgetInfo.percentage}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
