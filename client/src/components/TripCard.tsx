import { Edit, Trash2, MapPin, Calendar, Users, Euro } from "lucide-react";
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

  const getDestinationImage = (destination: string) => {
    const imageMap: { [key: string]: string } = {
      "DPS": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Bali
      "NRT": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Japan
      "CDG": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Paris
    };
    return imageMap[destination || ""] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div onClick={() => setLocation(`/trip-planning/${trip.id}`)}>
        <img 
          src={getDestinationImage(trip.destination || "")}
          alt="Travel destination" 
          className="w-full h-32 object-cover rounded-t-lg" 
        />
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
              {trip.name}
            </h3>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </div>
          
          <div className="space-y-2 text-sm text-slate-600 mb-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDateRange()}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{trip.travelers} Personen</span>
            </div>
            {trip.departure && trip.destination && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{trip.departure} → {trip.destination}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center">
                <Euro className="h-4 w-4 mr-1" />
                Gesamtbudget: <span className="font-semibold text-slate-900 ml-1">
                  {budgetInfo.totalBudget > 0 ? `€${budgetInfo.totalBudget.toLocaleString()}` : "Nicht festgelegt"}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-600 font-semibold">
                Verplant: €{budgetInfo.plannedBudget.toLocaleString()}
              </span>
              <span className="text-green-600 font-semibold">
                Verbleibend: €{budgetInfo.remainingBudget.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-green-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${budgetInfo.percentage}%` }}
            ></div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
