import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, Check, X, MapPin, Calendar, Clock, Euro, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertRestaurantSchema, type TripWithDetails, type Restaurant } from "@shared/schema";
import { z } from "zod";

interface RestaurantListProps {
  trip: TripWithDetails;
}

const restaurantFormSchema = insertRestaurantSchema.extend({
  // Alle Felder sind optional für das Formular, außer name
  name: z.string().min(1, "Name ist erforderlich"),
}).omit({
  tripId: true, // tripId wird automatisch hinzugefügt
});

export default function RestaurantList({ trip }: RestaurantListProps) {
  console.log("🔄 RestaurantList re-rendered mit trip:", trip);
  console.log("🔄 Restaurants Anzahl:", trip.restaurants?.length || 0);
  
  // Debug: Zeige alle Restaurant-Daten im Detail
  if (trip.restaurants && trip.restaurants.length > 0) {
    console.log("🔄 Restaurant-Details:");
    trip.restaurants.forEach((restaurant, index) => {
      console.log(`🔄 Restaurant ${index + 1}:`, {
        id: restaurant.id,
        name: restaurant.name,
        date: restaurant.date,
        timeFrom: restaurant.timeFrom,
        timeTo: restaurant.timeTo,
        address: restaurant.address,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange,
        status: restaurant.status,
        comment: restaurant.comment,
        reservationLink: restaurant.reservationLink
      });
    });
  }
  
  // Handle the unusual trip structure where trip data is under trip[0]
  const tripData = trip.id ? trip : (trip as any)[0];
  const tripId = tripData?.id;
  
  console.log("🔄 Extracted tripData:", tripData);
  console.log("🔄 Extracted tripId:", tripId);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const form = useForm<z.infer<typeof restaurantFormSchema>>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      address: "",
      date: "",
      timeFrom: "",
      timeTo: "",
      cuisine: "",
      priceRange: "",
      reservationLink: "",
      status: "geplant",
      comment: "",
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof restaurantFormSchema>) => {
      console.log("🔵 Restaurant Mutation gestartet mit Form-Daten:", data);
      console.log("🔵 Trip ID:", tripId);
      
      if (!tripId) {
        throw new Error("Trip ID ist nicht verfügbar");
      }
      
      // Clean up the data before sending
      const cleanData = {
        tripId: tripId,
        name: data.name,
        address: data.address?.trim() || null,
        date: data.date?.trim() || null,
        timeFrom: data.timeFrom?.trim() || null,
        timeTo: data.timeTo?.trim() || null,
        cuisine: data.cuisine?.trim() || null,
        priceRange: data.priceRange || null,
        reservationLink: data.reservationLink?.trim() || null,
        status: data.status || "geplant",
        comment: data.comment?.trim() || null,
      };
      
      console.log("🔵 Daten, die gespeichert werden:", cleanData);
      console.log("🔵 API-URL:", `/api/trips/${tripId}/restaurants`);
      
      const response = await apiRequest("POST", `/api/trips/${tripId}/restaurants`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (newRestaurant):", result);
      
      return result;
    },
    onSuccess: (newRestaurant) => {
      console.log("🟢 onSuccess aufgerufen mit:", newRestaurant);
      
      // Update the cache directly with the new restaurant
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        console.log("🟢 Aktualisiere Cache direkt. Alte restaurants:", oldData.restaurants?.length || 0);
        
        const updatedTrip = {
          ...oldData,
          restaurants: [...(oldData.restaurants || []), newRestaurant]
        };
        
        console.log("🟢 Neue restaurants nach Update:", updatedTrip.restaurants.length);
        return updatedTrip;
      });
      
      console.log("🟢 Cache direkt aktualisiert (ohne Invalidierung), setze UI zurück");
      setIsAdding(false);
      form.reset();
      
      toast({
        title: "Restaurant erstellt",
        description: "Das Restaurant wurde erfolgreich hinzugefügt.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error creating restaurant:", error);
      toast({
        title: "Fehler",
        description: "Das Restaurant konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof restaurantFormSchema> }) => {
      console.log("🔵 Update Restaurant Mutation gestartet mit:", { id, data });
      
      // Clean up the data before sending
      const cleanData = {
        name: data.name,
        address: data.address?.trim() || null,
        date: data.date?.trim() || null,
        timeFrom: data.timeFrom?.trim() || null,
        timeTo: data.timeTo?.trim() || null,
        cuisine: data.cuisine?.trim() || null,
        priceRange: data.priceRange || null,
        reservationLink: data.reservationLink?.trim() || null,
        status: data.status || "geplant",
        comment: data.comment?.trim() || null,
      };
      
      console.log("🔵 Update-Daten, die gespeichert werden:", cleanData);
      
      const response = await apiRequest("PUT", `/api/restaurants/${id}`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (updatedRestaurant):", result);
      
      return result;
    },
    onSuccess: (updatedRestaurant) => {
      console.log("🟢 Update onSuccess aufgerufen mit:", updatedRestaurant);
      
      // Update the cache directly with the updated restaurant
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        const updatedTrip = {
          ...oldData,
          restaurants: oldData.restaurants?.map(restaurant => 
            restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
          ) || []
        };
        
        console.log("🟢 Restaurant aktualisiert im Cache");
        return updatedTrip;
      });
      
      setEditingRestaurant(null);
      form.reset();
      
      toast({
        title: "Restaurant aktualisiert",
        description: "Das Restaurant wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error updating restaurant:", error);
      toast({
        title: "Fehler",
        description: "Das Restaurant konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/restaurants/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the cache directly by removing the deleted item
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        const updatedTrip = {
          ...oldData,
          restaurants: oldData.restaurants?.filter(restaurant => restaurant.id !== deletedId) || []
        };
        
        console.log("🗑️ Restaurant gelöscht, neue Anzahl:", updatedTrip.restaurants.length);
        return updatedTrip;
      });
      
      toast({
        title: "Restaurant gelöscht",
        description: "Das Restaurant wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Restaurant konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof restaurantFormSchema>) => {
    // Validiere, dass mindestens der Name ausgefüllt ist
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Restaurant-Namen ein.",
        variant: "destructive",
      });
      return;
    }
    
    createRestaurantMutation.mutate(data);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    form.reset({
      name: "",
      address: "",
      date: "",
      timeFrom: "",
      timeTo: "",
      cuisine: "",
      priceRange: "",
      reservationLink: "",
      status: "geplant",
      comment: "",
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    form.reset();
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsAdding(false); // Schließe Add-Modus falls offen
    
    // Fülle das Formular mit den aktuellen Werten
    form.reset({
      name: restaurant.name,
      address: restaurant.address || "",
      date: restaurant.date || "",
      timeFrom: restaurant.timeFrom || "",
      timeTo: restaurant.timeTo || "",
      cuisine: restaurant.cuisine || "",
      priceRange: restaurant.priceRange || "",
      reservationLink: restaurant.reservationLink || "",
      status: restaurant.status || "geplant",
      comment: restaurant.comment || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingRestaurant(null);
    form.reset();
  };

  const handleUpdateRestaurant = () => {
    if (!editingRestaurant) return;
    
    const formData = form.getValues();
    updateRestaurantMutation.mutate({
      id: editingRestaurant.id,
      data: formData
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "reserviert" 
      ? <Badge className="bg-green-500 text-white">Reserviert</Badge>
      : <Badge variant="secondary">Geplant</Badge>;
  };

  const getPriceRangeDisplay = (priceRange: string) => {
    switch (priceRange) {
      case "€": return "€ (Budget)";
      case "€€": return "€€ (Mittel)";
      case "€€€": return "€€€ (Gehoben)";
      case "€€€€": return "€€€€ (Luxus)";
      default: return priceRange;
    }
  };

  return (
    <div className="space-y-6">
      {/* Restaurants Overview */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Restaurant-Übersicht</CardTitle>
            <div className="text-right">
              <div className="text-sm text-slate-600">Geplante Restaurants</div>
              <div className="text-2xl font-bold text-slate-900">
                {trip.restaurants?.length || 0}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Geplant</div>
              <div className="text-xl font-bold text-blue-600">
                {(trip.restaurants || []).filter(r => r.status === "geplant").length}
              </div>
              <div className="text-sm text-slate-500">Restaurants</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Reserviert</div>
              <div className="text-xl font-bold text-green-600">
                {(trip.restaurants || []).filter(r => r.status === "reserviert").length}
              </div>
              <div className="text-sm text-slate-500">Restaurants</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Restaurants</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                {trip.restaurants?.length || 0} Restaurants
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddNew}
                disabled={isAdding}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Restaurant hinzufügen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Name & Details
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Küche & Preis
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Kommentar
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Reservierung
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Existing restaurants */}
                {(trip.restaurants || []).map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-slate-50">
                    {editingRestaurant?.id === restaurant.id ? (
                      // Edit mode row
                      <>
                        <td className="py-3 px-3">
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={form.watch("name") || ""}
                              onChange={(e) => form.setValue("name", e.target.value)}
                              className="w-full"
                            />
                            <div className="grid grid-cols-4 gap-2">
                              <Input
                                type="date"
                                value={form.watch("date") || ""}
                                onChange={(e) => form.setValue("date", e.target.value)}
                                className="w-full text-xs col-span-2"
                              />
                              <Input
                                type="time"
                                value={form.watch("timeFrom") || ""}
                                onChange={(e) => form.setValue("timeFrom", e.target.value)}
                                className="w-full text-xs"
                              />
                              <Input
                                type="time"
                                value={form.watch("timeTo") || ""}
                                onChange={(e) => form.setValue("timeTo", e.target.value)}
                                className="w-full text-xs"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            type="text"
                            value={form.watch("address") || ""}
                            onChange={(e) => form.setValue("address", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={form.watch("cuisine") || ""}
                              onChange={(e) => form.setValue("cuisine", e.target.value)}
                              className="w-full text-xs"
                            />
                            <Select 
                              value={form.watch("priceRange") || ""} 
                              onValueChange={(value) => form.setValue("priceRange", value)}
                            >
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Preis" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="€">€ (Budget)</SelectItem>
                                <SelectItem value="€€">€€ (Mittel)</SelectItem>
                                <SelectItem value="€€€">€€€ (Gehoben)</SelectItem>
                                <SelectItem value="€€€€">€€€€ (Luxus)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Select 
                            value={form.watch("status") || "geplant"} 
                            onValueChange={(value) => form.setValue("status", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geplant">Geplant</SelectItem>
                              <SelectItem value="reserviert">Reserviert</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            type="text"
                            value={form.watch("comment") || ""}
                            onChange={(e) => form.setValue("comment", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            type="text"
                            value={form.watch("reservationLink") || ""}
                            onChange={(e) => form.setValue("reservationLink", e.target.value)}
                            className="w-full"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={handleUpdateRestaurant}
                              disabled={updateRestaurantMutation.isPending}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Normal display mode
                      <>
                        <td className="py-3 px-3 text-sm">
                          <div className="space-y-1">
                            <div className="text-slate-900 font-medium">
                              {restaurant.name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3">
                              {restaurant.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(restaurant.date).toLocaleDateString("de-DE")}
                                </span>
                              )}
                              {(restaurant.timeFrom || restaurant.timeTo) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {restaurant.timeFrom && restaurant.timeTo 
                                    ? `${restaurant.timeFrom} - ${restaurant.timeTo}`
                                    : restaurant.timeFrom || restaurant.timeTo
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-600">
                          {restaurant.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {restaurant.address}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-600">
                          <div className="space-y-1">
                            {restaurant.cuisine && (
                              <div className="flex items-center gap-1">
                                <Utensils className="h-3 w-3 text-slate-400" />
                                {restaurant.cuisine}
                              </div>
                            )}
                            {restaurant.priceRange && (
                              <div className="text-xs text-slate-500">
                                {getPriceRangeDisplay(restaurant.priceRange)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {getStatusBadge(restaurant.status || "geplant")}
                        </td>
                        <td className="py-3 px-3 text-sm text-slate-600 max-w-xs truncate">
                          {restaurant.comment || "-"}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {restaurant.reservationLink ? (
                            <a 
                              href={restaurant.reservationLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Link
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditRestaurant(restaurant)}
                              disabled={editingRestaurant !== null || isAdding}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteRestaurantMutation.mutate(restaurant.id)}
                              disabled={deleteRestaurantMutation.isPending}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {/* Add new restaurant row */}
                {isAdding && (
                  <tr className="bg-blue-50 border-2 border-blue-200">
                    <td className="py-3 px-3">
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="z.B. Locavore Restaurant"
                          value={form.watch("name") || ""}
                          onChange={(e) => form.setValue("name", e.target.value)}
                          className="w-full"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="date"
                            value={form.watch("date") || ""}
                            onChange={(e) => form.setValue("date", e.target.value)}
                            className="w-full text-xs col-span-2"
                          />
                          <Input
                            type="time"
                            placeholder="Von"
                            value={form.watch("timeFrom") || ""}
                            onChange={(e) => form.setValue("timeFrom", e.target.value)}
                            className="w-full text-xs"
                          />
                          <Input
                            type="time"
                            placeholder="Bis"
                            value={form.watch("timeTo") || ""}
                            onChange={(e) => form.setValue("timeTo", e.target.value)}
                            className="w-full text-xs"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        type="text"
                        value={form.watch("address") || ""}
                        onChange={(e) => form.setValue("address", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="z.B. Modern Indonesisch"
                          value={form.watch("cuisine") || ""}
                          onChange={(e) => form.setValue("cuisine", e.target.value)}
                          className="w-full text-xs"
                        />
                        <Select 
                          value={form.watch("priceRange") || ""} 
                          onValueChange={(value) => form.setValue("priceRange", value)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Preis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="€">€ (Budget)</SelectItem>
                            <SelectItem value="€€">€€ (Mittel)</SelectItem>
                            <SelectItem value="€€€">€€€ (Gehoben)</SelectItem>
                            <SelectItem value="€€€€">€€€€ (Luxus)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Select 
                        value={form.watch("status") || "geplant"} 
                        onValueChange={(value) => form.setValue("status", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geplant">Geplant</SelectItem>
                          <SelectItem value="reserviert">Reserviert</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        type="text"
                        placeholder="Kommentar..."
                        value={form.watch("comment") || ""}
                        onChange={(e) => form.setValue("comment", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        type="text"
                        placeholder="https://..."
                        value={form.watch("reservationLink") || ""}
                        onChange={(e) => form.setValue("reservationLink", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => {
                            const formData = form.getValues();
                            onSubmit(formData);
                          }}
                          disabled={createRestaurantMutation.isPending}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleCancelAdd}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Empty state */}
                {(trip.restaurants || []).length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 bg-slate-50">
                      <p className="text-sm">Noch keine Restaurants geplant.</p>
                      <p className="text-xs mt-1">Klicke auf "Restaurant hinzufügen" um zu beginnen.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
