import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertBudgetItemSchema, type TripWithDetails, type BudgetItem } from "@shared/schema";
import { z } from "zod";

interface BudgetOverviewProps {
  trip: TripWithDetails;
}

const budgetItemFormSchema = insertBudgetItemSchema.extend({
  unitPrice: z.string().min(1, "Preis ist erforderlich"),
  totalPrice: z.string().optional(),
});

export default function BudgetOverview({ trip }: BudgetOverviewProps) {
  console.log("trip in BudgetOverview:", trip);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const form = useForm<z.infer<typeof budgetItemFormSchema>>({
    resolver: zodResolver(budgetItemFormSchema),
    defaultValues: {
      category: "",
      subcategory: "",
      quantity: 1,
      unitPrice: "",
      comment: "",
      affiliateLink: "",
    },
  });

  const createBudgetItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof budgetItemFormSchema>) => {
      const unitPrice = parseFloat(data.unitPrice);
      const totalPrice = unitPrice * (data.quantity || 1);
      
      const response = await apiRequest("POST", `/api/trips/${trip.id}/budget-items`, {
        ...data,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Budget-Eintrag erstellt",
        description: "Der Budget-Eintrag wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Budget-Eintrag konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const deleteBudgetItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budget-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      toast({
        title: "Budget-Eintrag gelöscht",
        description: "Der Budget-Eintrag wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Budget-Eintrag konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof budgetItemFormSchema>) => {
    createBudgetItemMutation.mutate(data);
  };

  const calculateBudgetSummary = () => {
    const totalBudget = parseFloat(trip.totalBudget || "0");
    const plannedBudget = (trip.budgetItems || []).reduce((sum, item) => {
      return sum + parseFloat(item.totalPrice || "0");
    }, 0);
    const remaining = totalBudget - plannedBudget;
    const percentage = totalBudget > 0 ? Math.round((plannedBudget / totalBudget) * 100) : 0;
    
    // Calculate daily budget
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
    const dailyBudget = totalBudget / days;

    return {
      totalBudget,
      plannedBudget,
      remaining,
      percentage,
      dailyBudget,
      days,
    };
  };

  const summary = calculateBudgetSummary();

  const mainCategories = [
    "Transport",
    "Unterkunft", 
    "Verpflegung",
    "Aktivitäten",
    "Versicherung",
    "Sonstiges"
  ];

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget-Übersicht</CardTitle>
            <div className="text-right">
              <div className="text-sm text-slate-600">Gesamtbudget</div>
              <div className="text-2xl font-bold text-slate-900">
                €{summary.totalBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Verplant</div>
              <div className="text-xl font-bold text-green-600">
                €{summary.plannedBudget.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">{summary.percentage}% des Budgets</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Verfügbar</div>
              <div className="text-xl font-bold text-slate-900">
                €{summary.remaining.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">
                {100 - summary.percentage}% übrig
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Tagesbudget</div>
              <div className="text-xl font-bold text-slate-900">
                €{Math.round(summary.dailyBudget).toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">{summary.days} Reisetage</div>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mt-6">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(summary.percentage, 100)}%` }}
            ></div>
          </div>
          {summary.percentage > 100 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              ⚠️ Budget um €{(summary.plannedBudget - summary.totalBudget).toLocaleString()} überschritten!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget-Kategorien</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Eintrag hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Budget-Eintrag hinzufügen</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategorie</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kategorie wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mainCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unterkategorie</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Flüge, Hotel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Menge</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preis/Einheit (€)</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kommentar (optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Zusätzliche Informationen" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="affiliateLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createBudgetItemMutation.isPending}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Hinzufügen
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!trip.budgetItems || trip.budgetItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Noch keine Budget-Einträge vorhanden.</p>
              <p className="text-sm">Füge deinen ersten Eintrag hinzu, um zu beginnen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Kategorie</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Unterkategorie</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Menge</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Preis/Einheit</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Summe</th>
                    <th className="text-left py-3 text-sm font-medium text-slate-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trip.budgetItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm text-slate-900">{item.category}</td>
                      <td className="py-3 text-sm text-slate-600">{item.subcategory}</td>
                      <td className="py-3 text-sm text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-sm text-slate-600">
                        €{parseFloat(item.unitPrice || "0").toLocaleString()}
                      </td>
                      <td className="py-3 text-sm font-semibold text-slate-900">
                        €{parseFloat(item.totalPrice || "0").toLocaleString()}
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteBudgetItemMutation.mutate(item.id)}
                            disabled={deleteBudgetItemMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations Placeholder */}
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Unsere Empfehlungen</h3>
          <p className="text-slate-500 mb-4">
            Hier werden später personalisierte Hotel- und Flugempfehlungen angezeigt
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🚗</div>
              <div className="text-sm text-slate-500">Mietwagen-Angebote</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-sm text-slate-500">Aktivitäten-Vorschläge</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
