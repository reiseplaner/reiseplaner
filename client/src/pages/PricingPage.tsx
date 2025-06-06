import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Plane, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import Navigation from '../components/Navigation';

interface SubscriptionPlan {
  id: 'free' | 'pro' | 'veteran';
  name: string;
  price: number;
  currency: string;
  tripsLimit: number;
  canExport: boolean;
  features: string[];
}

interface SubscriptionInfo {
  status: 'free' | 'pro' | 'veteran';
  tripsUsed: number;
  tripsLimit: number;
  canExport: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        apiRequest('GET', '/api/subscription/plans').then(res => res.json()),
        apiRequest('GET', '/api/user/subscription').then(res => res.json())
      ]);
      
      setPlans(plansResponse);
      setCurrentSubscription(subscriptionResponse);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: 'Fehler',
        description: 'Pricing-Daten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setUpgrading(planId);
    try {
      const response = await apiRequest('POST', '/api/subscription/create-checkout', {
        planId
      });
      const responseData = await response.json();
      
      if (responseData.mock) {
        // Mock upgrade for now
        toast({
          title: 'Mock Upgrade',
          description: `${responseData.message}`,
        });
        // Simulate successful upgrade in demo
        setTimeout(() => {
          setCurrentSubscription(prev => prev ? {
            ...prev,
            status: planId as any,
            tripsLimit: plans[planId]?.tripsLimit || 10,
            canExport: plans[planId]?.canExport || true
          } : null);
        }, 1000);
      } else {
        // Redirect to Stripe checkout
        window.location.href = responseData.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Fehler',
        description: 'Upgrade konnte nicht gestartet werden',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Plane className="h-8 w-8 text-blue-500" />;
      case 'pro':
        return <Sparkles className="h-8 w-8 text-purple-500" />;
      case 'veteran':
        return <Crown className="h-8 w-8 text-yellow-500" />;
      default:
        return <Plane className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-blue-200';
      case 'pro':
        return 'border-purple-200 bg-purple-50/50';
      case 'veteran':
        return 'border-yellow-200 bg-yellow-50/50';
      default:
        return 'border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Plane className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-500" />
            <p className="text-lg text-gray-600">Lade Pricing-Optionen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wählen Sie Ihren Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Planen Sie mehr Reisen und nutzen Sie erweiterte Features für Ihre Traumurlaube
          </p>
          
          {currentSubscription && (
            <div className="mt-6">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Aktueller Plan: <span className="font-bold ml-1">{plans[currentSubscription.status]?.name}</span>
              </Badge>
              <p className="text-sm text-gray-500 mt-2">
                {currentSubscription.tripsUsed} von {currentSubscription.tripsLimit === Infinity ? '∞' : currentSubscription.tripsLimit} Reisen verwendet
              </p>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.values(plans).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${getPlanColor(plan.id)} ${
                currentSubscription?.status === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}>
                {plan.id === 'pro' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                    Beliebt
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {plan.id === 'free' && 'Perfekt für Gelegenheitsreisende'}
                    {plan.id === 'pro' && 'Ideal für regelmäßige Reisen'}
                    {plan.id === 'veteran' && 'Für echte Reise-Profis'}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      €{plan.price.toFixed(2)}
                    </div>
                    <div className="text-gray-500">
                      {plan.price === 0 ? 'Kostenlos' : 'pro Monat'}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    {currentSubscription?.status === plan.id ? (
                      <Button className="w-full" disabled>
                        Aktueller Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.id === 'free' ? 'outline' : 'default'}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={upgrading === plan.id}
                      >
                        {upgrading === plan.id ? (
                          'Upgrading...'
                        ) : (
                          plan.id === 'free' ? 'Kostenlos bleiben' : `Auf ${plan.name} upgraden`
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Häufig gestellte Fragen</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">Kann ich jederzeit kündigen?</h3>
              <p className="text-gray-600">Ja, alle Pläne sind monatlich kündbar. Keine langfristigen Verpflichtungen.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Welche Zahlungsmethoden werden akzeptiert?</h3>
              <p className="text-gray-600">Wir akzeptieren alle gängigen Kreditkarten und SEPA-Lastschrift über Stripe.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Was passiert mit meinen Daten bei der Kündigung?</h3>
              <p className="text-gray-600">Ihre Reisedaten bleiben erhalten, aber Premium-Features werden deaktiviert.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Gibt es einen kostenlosen Test?</h3>
              <p className="text-gray-600">Der Standard-Plan ist dauerhaft kostenlos mit 2 Reisen zum Testen.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 