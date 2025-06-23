import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { 
  ExternalLink
} from 'lucide-react';



export default function PaymentMethodsTab() {
  const { toast } = useToast();

  // Create billing portal session mutation
  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/portal", {});
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe customer portal
      window.open(data.url, '_blank');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Billing-Portal konnte nicht geöffnet werden.";
      
      // Check for specific Stripe configuration error
      if (errorMessage.includes("No configuration provided")) {
        toast({
          title: "Stripe Konfiguration erforderlich",
          description: "Das Stripe Customer Portal muss zuerst im Stripe Dashboard konfiguriert werden. Kontaktiere den Support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Stripe Customer Portal Option */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Zahlungsdaten bei Stripe verwalten</span>
            </div>
            <Button
              onClick={() => billingPortalMutation.mutate()}
              disabled={billingPortalMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {billingPortalMutation.isPending ? 'Öffne...' : 'Zu Stripe wechseln'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-700">
            <p className="mb-2">
              <strong>Empfohlen:</strong> Verwende das sichere Stripe Customer Portal, um alle deine Zahlungsdaten zu verwalten.
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Zahlungsmethoden hinzufügen und entfernen</li>
              <li>Standard-Zahlungsmethode ändern</li>
              <li>Rechnungshistorie einsehen</li>
              <li>Abonnement verwalten</li>
              <li>Höchste Sicherheitsstandards</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 