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
        return (
          <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center">
            <Plane className="h-7 w-7 text-white" />
          </div>
        );
      case 'pro':
        return (
          <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
        );
      case 'veteran':
        return (
          <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center">
            <Crown className="h-7 w-7 text-white" />
          </div>
        );
      default:
        return (
          <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center">
            <Plane className="h-7 w-7 text-white" />
          </div>
        );
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white';
      case 'pro':
        return 'border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ring-2 ring-slate-900';
      case 'veteran':
        return 'border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white';
      default:
        return 'border-0 shadow-lg bg-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Plane className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg text-slate-600">Lade Pricing-Optionen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Premium Reiseplanung für Profis
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Wählen Sie
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent block">
                Ihren Plan
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Planen Sie mehr Reisen und nutzen Sie erweiterte Features für Ihre Traumurlaube. 
              Professionelle Tools für jeden Reisetyp.
            </p>
            
            {currentSubscription && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-900 font-semibold">Aktueller Plan: {plans[currentSubscription.status]?.name}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {currentSubscription.tripsUsed} von {currentSubscription.tripsLimit === Infinity ? '∞' : currentSubscription.tripsLimit} Reisen verwendet
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
          {Object.values(plans).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col ${getPlanColor(plan.id)} ${
                currentSubscription?.status === plan.id ? 'ring-2 ring-green-500' : ''
              }`}>
                {plan.id === 'pro' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white">
                    Beliebt
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-lg text-slate-600">
                    {plan.id === 'free' && 'Perfekt für Gelegenheitsreisende'}
                    {plan.id === 'pro' && 'Ideal für regelmäßige Reisen'}
                    {plan.id === 'veteran' && 'Für echte Reise-Profis'}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="text-4xl font-bold text-slate-900">
                      €{plan.price.toFixed(2)}
                    </div>
                    <div className="text-slate-500">
                      {plan.price === 0 ? 'Kostenlos' : 'pro Monat'}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-grow text-center">
                  {/* Features */}
                  <div className="space-y-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3 text-left">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-600 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="mt-8">
                    {currentSubscription?.status === plan.id ? (
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-3 font-semibold" disabled>
                        ✓ Aktueller Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full rounded-full py-3 font-semibold transition-all duration-200 ${
                          plan.id === 'free' 
                            ? 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
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
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-slate-600 mb-16 max-w-2xl mx-auto">
              Alles was Sie über unsere Pläne wissen müssen
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <Card className="border-0 shadow-lg bg-white p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Kann ich jederzeit kündigen?</h3>
                <p className="text-slate-600">Ja, alle Pläne sind monatlich kündbar. Keine langfristigen Verpflichtungen.</p>
              </Card>
              <Card className="border-0 shadow-lg bg-white p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Welche Zahlungsmethoden werden akzeptiert?</h3>
                <p className="text-slate-600">Wir akzeptieren alle gängigen Kreditkarten und SEPA-Lastschrift über Stripe.</p>
              </Card>
              <Card className="border-0 shadow-lg bg-white p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Was passiert mit meinen Daten bei der Kündigung?</h3>
                <p className="text-slate-600">Ihre Reisedaten bleiben erhalten, aber Premium-Features werden deaktiviert.</p>
              </Card>
              <Card className="border-0 shadow-lg bg-white p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Gibt es einen kostenlosen Test?</h3>
                <p className="text-slate-600">Der Standard-Plan ist dauerhaft kostenlos mit 1 Reise zum Testen.</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 