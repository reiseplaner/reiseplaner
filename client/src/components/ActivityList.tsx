import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, Check, X, MapPin, Calendar, Clock, Euro } from "lucide-react";
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
import { insertActivitySchema, type TripWithDetails, type Activity } from "@shared/schema";
import { z } from "zod";

interface ActivityListProps {
  trip: TripWithDetails;
}

const activityFormSchema = insertActivitySchema.extend({
  price: z.string().optional(),
}).omit({
  tripId: true, // tripId wird automatisch hinzugefügt
  category: true, // category wird automatisch aus addingToCategory gesetzt
});

// Activity categories and subcategories
const activityCategories = {
  "Aktivitäten": [
    "Museen",
    "Historische Stätten",
    "Kirchen & Tempel",
    "Stadtführung",
    "Aussichtspunkte",
    "Architektur",
    "Denkmäler",
    "Wandern",
    "Tauchen & Schnorcheln",
    "Surfen",
    "Klettern",
    "Radfahren",
    "Wassersport",
    "Safari",
    "Nationalparks",
    "Strände",
    "Konzerte",
    "Theater & Shows",
    "Festivals",
    "Nachtleben",
    "Freizeitparks",
    "Märkte",
    "Shopping",
    "Spa & Massage",
    "Yoga",
    "Meditation",
    "Thermalbäder",
    "Wellness-Hotels",
    "Kochkurse",
    "Food Tours",
    "Weinverkostung",
    "Brauerei-Besichtigung",
    "Tagesausflüge",
    "Mehrtagestouren",
    "Bootstouren",
    "Helikopter-Rundflüge",
    "Zugreisen",
    "Sonstiges"
  ]
};

export default function ActivityList({ trip }: ActivityListProps) {
  console.log("🔄 ActivityList re-rendered mit trip:", trip);
  console.log("🔄 Activities Anzahl:", trip.activities?.length || 0);
  console.log("🔄 Trip Eigenschaften:", Object.keys(trip));
  console.log("🔄 Trip ID direkt:", trip.id);
  console.log("🔄 Trip vollständig:", JSON.stringify(trip, null, 2));
  
  // Handle the unusual trip structure where trip data is under trip[0]
  const tripData = trip.id ? trip : (trip as any)[0];
  const tripId = tripData?.id;
  
  console.log("🔄 Extracted tripData:", tripData);
  console.log("🔄 Extracted tripId:", tripId);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const form = useForm<z.infer<typeof activityFormSchema>>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      location: "",
      date: "",
      timeFrom: "",
      timeTo: "",
      price: "",
      comment: "",
      bookingLink: "",
      status: "geplant",
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof activityFormSchema>) => {
      console.log("🔵 Activity Mutation gestartet mit Form-Daten:", data);
      console.log("🔵 Aktuelle Kategorie (addingToCategory):", addingToCategory);
      console.log("🔵 Trip Objekt:", trip);
      console.log("🔵 Trip ID:", tripId);
      
      if (!tripId) {
        throw new Error("Trip ID ist nicht verfügbar");
      }
      
      // Clean up the data before sending
      const cleanData = {
        tripId: tripId,
        title: data.title,
        category: addingToCategory, // Die Kategorie, in der die Aktivität erstellt wird
        location: data.location?.trim() || null,
        date: data.date?.trim() || null,
        timeFrom: data.timeFrom?.trim() || null,
        timeTo: data.timeTo?.trim() || null,
        price: data.price?.trim() ? parseFloat(data.price.trim()).toString() : null,
        comment: data.comment?.trim() || null,
        bookingLink: data.bookingLink?.trim() || null,
        status: data.status || "geplant",
      };
      
      console.log("🔵 Daten, die gespeichert werden:", cleanData);
      console.log("🔵 API-URL:", `/api/trips/${tripId}/activities`);
      
      const response = await apiRequest("POST", `/api/trips/${tripId}/activities`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (newActivity):", result);
      
      return result;
    },
    onSuccess: (newActivity) => {
      console.log("🟢 onSuccess aufgerufen mit:", newActivity);
      
      // Update the cache directly with the new activity
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        console.log("🟢 Aktualisiere Cache direkt. Alte activities:", oldData.activities?.length || 0);
        
        const updatedTrip = {
          ...oldData,
          activities: [...(oldData.activities || []), newActivity]
        };
        
        console.log("🟢 Neue activities nach Update:", updatedTrip.activities.length);
        return updatedTrip;
      });
      
      console.log("🟢 Cache direkt aktualisiert (ohne Invalidierung), setze UI zurück");
      setAddingToCategory(null);
      form.reset();
      
      toast({
        title: "Aktivität erstellt",
        description: "Die Aktivität wurde erfolgreich hinzugefügt.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error creating activity:", error);
      toast({
        title: "Fehler",
        description: "Die Aktivität konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof activityFormSchema> }) => {
      console.log("🔵 Update Activity Mutation gestartet mit:", { id, data });
      
      // Clean up the data before sending
      const cleanData = {
        title: data.title,
        location: data.location?.trim() || null,
        date: data.date?.trim() || null,
        timeFrom: data.timeFrom?.trim() || null,
        timeTo: data.timeTo?.trim() || null,
        price: data.price?.trim() ? parseFloat(data.price.trim()).toString() : null,
        comment: data.comment?.trim() || null,
        bookingLink: data.bookingLink?.trim() || null,
        status: data.status || "geplant",
      };
      
      console.log("🔵 Update-Daten, die gespeichert werden:", cleanData);
      
      const response = await apiRequest("PUT", `/api/activities/${id}`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (updatedActivity):", result);
      
      return result;
    },
    onSuccess: (updatedActivity) => {
      console.log("🟢 Update onSuccess aufgerufen mit:", updatedActivity);
      
      // Update the cache directly with the updated activity
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        const updatedTrip = {
          ...oldData,
          activities: oldData.activities?.map(activity => 
            activity.id === updatedActivity.id ? updatedActivity : activity
          ) || []
        };
        
        console.log("🟢 Aktivität aktualisiert im Cache");
        return updatedTrip;
      });
      
      setEditingActivity(null);
      form.reset();
      
      toast({
        title: "Aktivität aktualisiert",
        description: "Die Aktivität wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error updating activity:", error);
      toast({
        title: "Fehler",
        description: "Die Aktivität konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/activities/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the cache directly by removing the deleted item
      queryClient.setQueryData(["/api/trips", tripId?.toString()], (oldData: TripWithDetails | undefined) => {
        if (!oldData) return oldData;
        
        const updatedTrip = {
          ...oldData,
          activities: oldData.activities?.filter(activity => activity.id !== deletedId) || []
        };
        
        console.log("🗑️ Aktivität gelöscht, neue Anzahl:", updatedTrip.activities.length);
        return updatedTrip;
      });
      
      toast({
        title: "Aktivität gelöscht",
        description: "Die Aktivität wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aktivität konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof activityFormSchema>) => {
    createActivityMutation.mutate(data);
  };

  const handleAddNew = (category: string) => {
    setAddingToCategory(category);
    form.reset({
      title: "",
      location: "",
      date: "",
      timeFrom: "",
      timeTo: "",
      price: "",
      comment: "",
      bookingLink: "",
      status: "geplant",
    });
  };

  const handleCancelAdd = () => {
    setAddingToCategory(null);
    form.reset();
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setAddingToCategory(null); // Schließe Add-Modus falls offen
    
    // Fülle das Formular mit den aktuellen Werten
    form.reset({
      title: activity.title,
      location: activity.location || "",
      date: activity.date || "",
      timeFrom: activity.timeFrom || "",
      timeTo: activity.timeTo || "",
      price: activity.price || "",
      comment: activity.comment || "",
      bookingLink: activity.bookingLink || "",
      status: activity.status || "geplant",
    });
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    form.reset();
  };

  const handleUpdateActivity = () => {
    if (!editingActivity) return;
    
    const formData = form.getValues();
    updateActivityMutation.mutate({
      id: editingActivity.id,
      data: formData
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "gebucht" 
      ? <Badge className="bg-green-500 text-white">Gebucht</Badge>
      : <Badge variant="secondary">Geplant</Badge>;
  };

  const mainCategories = Object.keys(activityCategories);

  // Group activities by category
  const groupedActivities = (trip.activities || []).reduce((acc, activity) => {
    // Alle Aktivitäten werden unter "Aktivitäten" gruppiert
    const category = "Aktivitäten";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="space-y-6">
      {/* Activities Overview */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Aktivitäten-Übersicht</CardTitle>
            <div className="text-right">
              <div className="text-sm text-slate-600">Geplante Aktivitäten</div>
              <div className="text-2xl font-bold text-slate-900">
                {trip.activities?.length || 0}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Geplant</div>
              <div className="text-xl font-bold text-blue-600">
                {(trip.activities || []).filter(a => a.status === "geplant").length}
              </div>
              <div className="text-sm text-slate-500">Aktivitäten</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Gebucht</div>
              <div className="text-xl font-bold text-green-600">
                {(trip.activities || []).filter(a => a.status === "gebucht").length}
              </div>
              <div className="text-sm text-slate-500">Aktivitäten</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Gesamtkosten</div>
              <div className="text-xl font-bold text-slate-900">
                €{(trip.activities || []).reduce((sum, activity) => {
                  return sum + parseFloat(activity.price || "0");
                }, 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Geschätzt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Categories */}
      <div className="space-y-4">
        {mainCategories.map((category) => {
          const categoryActivities = groupedActivities[category] || [];
          const isAddingToThisCategory = addingToCategory === category;
          
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">
                      {categoryActivities.length} Aktivitäten
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNew(category)}
                      disabled={addingToCategory !== null}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                Aktivität hinzufügen
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
                          Titel & Details
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Ort
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Preis
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Kommentar
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Buchungslink
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Existing activities */}
                      {categoryActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-slate-50">
                          {editingActivity?.id === activity.id ? (
                            // Edit mode row
                            <>
                              <td className="py-3 px-3">
                                <div className="space-y-2">
                                  <Input
                                    type="text"
                                    value={form.watch("title") || ""}
                                    onChange={(e) => form.setValue("title", e.target.value)}
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
                                <div className="space-y-1">
                                  <Input
                                    type="text"
                                    placeholder="z.B. Tanah Lot, Bali"
                                    value={form.watch("location") || ""}
                                    onChange={(e) => form.setValue("location", e.target.value)}
                                    className="w-full"
                                  />
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.watch("location") || "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                    title="In Google Maps öffnen"
                                  >
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                    in Google maps suchen
                                  </a>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <Input
                                  type="text"
                                  value={form.watch("price") || ""}
                                  onChange={(e) => form.setValue("price", e.target.value)}
                                  className="w-full"
                                />
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
                              <SelectItem value="gebucht">Gebucht</SelectItem>
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
                                  value={form.watch("bookingLink") || ""}
                                  onChange={(e) => form.setValue("bookingLink", e.target.value)}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex space-x-1">
                    <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={handleUpdateActivity}
                                    disabled={updateActivityMutation.isPending}
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
                                    {activity.title}
                      </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-3">
                                    {activity.date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(activity.date).toLocaleDateString("de-DE")}
                                      </span>
                                    )}
                                    {(activity.timeFrom || activity.timeTo) && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {activity.timeFrom && activity.timeTo 
                                          ? `${activity.timeFrom} - ${activity.timeTo}`
                                          : activity.timeFrom || activity.timeTo
                                        }
                                      </span>
                                    )}
                          </div>
                          </div>
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600">
                                {activity.location ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                      title="In Google Maps öffnen"
                                    >
                                      {activity.location}
                                    </a>
                          </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600">
                                {activity.price ? (
                                  <div className="flex items-center gap-1">
                                    <Euro className="h-3 w-3 text-slate-400" />
                                    {parseFloat(activity.price).toLocaleString()}
                      </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-3 text-sm">
                                {getStatusBadge(activity.status || "geplant")}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600 max-w-xs truncate">
                                {activity.comment || "-"}
                              </td>
                              <td className="py-3 px-3 text-sm">
                                {activity.bookingLink ? (
                        <a 
                          href={activity.bookingLink} 
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
                                    onClick={() => handleEditActivity(activity)}
                                    disabled={editingActivity !== null || addingToCategory !== null}
                                  >
                                    <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        disabled={deleteActivityMutation.isPending}
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
                      
                      {/* Add new activity row */}
                      {isAddingToThisCategory && (
                        <tr className="bg-blue-50 border-2 border-blue-200">
                          <td className="py-3 px-3">
                            <div className="space-y-2">
                              <Input
                                type="text"
                                placeholder="z.B. Tanah Lot Tempel Tour"
                                value={form.watch("title") || ""}
                                onChange={(e) => form.setValue("title", e.target.value)}
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
                            <div className="space-y-1">
                              <Input
                                type="text"
                                placeholder="z.B. Tanah Lot, Bali"
                                value={form.watch("location") || ""}
                                onChange={(e) => form.setValue("location", e.target.value)}
                                className="w-full"
                              />
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.watch("location") || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                title="In Google Maps öffnen"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                in Google maps suchen
                              </a>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={form.watch("price") || ""}
                              onChange={(e) => form.setValue("price", e.target.value)}
                              className="w-full"
                            />
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
                                <SelectItem value="gebucht">Gebucht</SelectItem>
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
                              value={form.watch("bookingLink") || ""}
                              onChange={(e) => form.setValue("bookingLink", e.target.value)}
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
                                disabled={createActivityMutation.isPending}
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
                      {categoryActivities.length === 0 && !isAddingToThisCategory && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 bg-slate-50">
                            <p className="text-sm">Noch keine Aktivitäten in dieser Kategorie.</p>
                            <p className="text-xs mt-1">Klicke auf "Aktivität hinzufügen" um zu beginnen.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </CardContent>
              </Card>
          );
        })}
      </div>

      {/* Recommendations Placeholder */}
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Aktivitäten-Empfehlungen</h3>
          <p className="text-slate-500 mb-4">
            Hier werden später personalisierte Aktivitäten-Empfehlungen angezeigt
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🏛️</div>
              <div className="text-sm text-slate-500">Kultur & Museen</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🏔️</div>
              <div className="text-sm text-slate-500">Outdoor-Abenteuer</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🍽️</div>
              <div className="text-sm text-slate-500">Kulinarische Erlebnisse</div>
            </div>
          </div>
      </CardContent>
    </Card>
    </div>
  );
}
