import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Star, 
  AlertCircle,
  Loader2,
  Check,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key
const stripePromise = loadStripe('pk_test_51Rb56HJxk5EsZYTy4Rp1YKNpxYcOuwVBbI4U2pGfXiAcCsJD0rKZdDSLnqoB7iDYNFJ8WLUmFG8vb2p5nJyxhf9000K5Oyt9tP');

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  isDefault: boolean;
}



// Card element wrapper component
function AddPaymentMethodForm({ onSuccess, onCancel }: { 
  onSuccess: () => void; 
  onCancel: () => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const setupIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/setup-intent');
      return response.json();
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create setup intent
      const { clientSecret } = await setupIntentMutation.mutateAsync();

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm setup intent
      const { error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message || 'Fehler beim Hinzufügen der Zahlungsmethode');
      }

      toast({
        title: "Zahlungsmethode hinzugefügt",
        description: "Deine neue Zahlungsmethode wurde erfolgreich hinzugefügt.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Zahlungsmethode konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing || setupIntentMutation.isPending}
        >
          {isProcessing || setupIntentMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Wird hinzugefügt...
            </>
          ) : (
            'Zahlungsmethode hinzufügen'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentMethodsTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment methods
  const { data: paymentMethodsData, isLoading } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/billing/payment-methods');
      return response.json();
    },
  });

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('POST', '/api/billing/set-default-payment-method', {
        paymentMethodId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Standard-Zahlungsmethode geändert",
        description: "Die Standard-Zahlungsmethode wurde erfolgreich geändert.",
      });
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Standard-Zahlungsmethode konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete payment method mutation
  const deleteMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('DELETE', `/api/billing/payment-methods/${paymentMethodId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zahlungsmethode entfernt",
        description: "Die Zahlungsmethode wurde erfolgreich entfernt.",
      });
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Zahlungsmethode konnte nicht entfernt werden.",
        variant: "destructive",
      });
    },
  });

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

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungsmethoden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const paymentMethods: PaymentMethod[] = paymentMethodsData?.paymentMethods || [];

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

      {/* In-App Payment Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Direkte Verwaltung
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Neue Karte hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Zahlungsmethode hinzufügen</DialogTitle>
                  <DialogDescription>
                    Füge eine neue Kreditkarte zu deinem Account hinzu.
                  </DialogDescription>
                </DialogHeader>
                <Elements stripe={stripePromise}>
                  <AddPaymentMethodForm 
                    onSuccess={handleAddSuccess}
                    onCancel={() => setShowAddDialog(false)}
                  />
                </Elements>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du hast noch keine Zahlungsmethoden hinzugefügt. Füge eine Kreditkarte hinzu, um Premium-Features zu nutzen.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((paymentMethod) => (
              <div
                key={paymentMethod.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getCardBrandIcon(paymentMethod.card?.brand || '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCardBrand(paymentMethod.card?.brand || '')} •••• {paymentMethod.card?.last4}
                      </span>
                      {paymentMethod.isDefault && (
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Standard
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      Läuft ab: {paymentMethod.card?.expMonth?.toString().padStart(2, '0')}/{paymentMethod.card?.expYear}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!paymentMethod.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(paymentMethod.id)}
                      disabled={setDefaultMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      {setDefaultMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Als Standard festlegen
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(paymentMethod.id)}
                    disabled={deleteMutation.isPending || paymentMethod.isDefault}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    title={paymentMethod.isDefault ? "Standard-Zahlungsmethode kann nicht gelöscht werden" : "Zahlungsmethode entfernen"}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Entfernen
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="text-sm text-slate-600 mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Hinweis:</strong> Deine Standard-Zahlungsmethode wird für zukünftige Rechnungen verwendet. 
                  Du kannst sie jederzeit ändern oder weitere Zahlungsmethoden hinzufügen.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
} 