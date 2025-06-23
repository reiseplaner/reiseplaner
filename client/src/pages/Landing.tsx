import { MapPin, Wallet, Calendar, FileDown, ArrowRight, Check, Sparkles, Users, TrendingUp, Star, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

export default function Landing() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState("budget");

  // Demo-Daten
  const demoTrip = {
    budgetItems: [
      { 
        id: 1, 
        category: "Transport", 
        subcategory: "Flug", 
        quantity: 2, 
        unitPrice: "600", 
        totalPrice: "1200", 
        comment: "Hin- und Rückflug nach Tokio"
      },
      { 
        id: 2, 
        category: "Hotel", 
        subcategory: "Hotel", 
        quantity: 7, 
        unitPrice: "120", 
        totalPrice: "840", 
        comment: "Shibuya Crossing Hotel"
      },
      { 
        id: 3, 
        category: "Verpflegung", 
        subcategory: "Abendessen", 
        quantity: 7, 
        unitPrice: "30", 
        totalPrice: "210", 
        comment: "Lokale Restaurants"
      },
      { 
        id: 4, 
        category: "Aktivitäten", 
        subcategory: "Stadtführung", 
        quantity: 1, 
        unitPrice: "90", 
        totalPrice: "90", 
        comment: "Tokio Highlights Tour"
      },
      { 
        id: 5, 
        category: "Aktivitäten", 
        subcategory: "Sehenswürdigkeiten", 
        quantity: 3, 
        unitPrice: "25", 
        totalPrice: "75", 
        comment: "Tempel & Museen"
      },
      { 
        id: 6, 
        category: "Transport", 
        subcategory: "Öffentliche Verkehrsmittel", 
        quantity: 7, 
        unitPrice: "15", 
        totalPrice: "105", 
        comment: "JR Pass Tagestickets"
      },
    ],
    totalBudget: 2500,
  };

  const demoReceipts = [
    {
      id: "r1",
      itemName: "Flug nach Tokio",
      total: 1200,
      payer: "Anna",
      persons: [
        { name: "Anna", percent: 50, isPayer: true },
        { name: "Ben", percent: 50, isPayer: false },
      ],
      debts: [{ from: "Ben", to: "Anna", amount: 600 }],
    },
    {
      id: "r2",
      itemName: "Hotel (7 Nächte)",
      total: 840,
      payer: "Ben",
      persons: [
        { name: "Anna", percent: 50, isPayer: false },
        { name: "Ben", percent: 50, isPayer: true },
      ],
      debts: [{ from: "Anna", to: "Ben", amount: 420 }],
    },
    {
      id: "r3",
      itemName: "Gemeinsame Abendessen",
      total: 210,
      payer: "Anna",
      persons: [
        { name: "Anna", percent: 60, isPayer: true },
        { name: "Ben", percent: 40, isPayer: false },
      ],
      debts: [{ from: "Ben", to: "Anna", amount: 84 }],
    },
  ];

  const categoryColors = {
    Transport: "bg-blue-500",
    Hotel: "bg-purple-500", 
    Verpflegung: "bg-green-500",
    Aktivitäten: "bg-yellow-500",
    Versicherung: "bg-red-500",
    Sonstiges: "bg-slate-500"
  };

  const budgetSummary = {
    totalBudget: demoTrip.totalBudget,
    plannedBudget: demoTrip.budgetItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0),
    get percentage() {
      return Math.round((this.plannedBudget / this.totalBudget) * 100);
    },
    get remaining() {
      return this.totalBudget - this.plannedBudget;
    }
  };

  const getCategoryTotal = (cat: string) => {
    return demoTrip.budgetItems
      .filter(i => i.category === cat)
      .reduce((sum, i) => sum + parseFloat(i.totalPrice), 0);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Es gab ein Problem bei der Google-Anmeldung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setIsLoading(true);
      await signInWithEmail(email, password);
      toast({
        title: "Erfolgreich angemeldet!",
        description: "Willkommen zurück bei ReiseVeteran.",
      });
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setIsLoading(true);
      await signUpWithEmail(email, password);
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte prüfe deine E-Mails für die Bestätigung.",
      });
    } catch (error) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: "Es gab ein Problem bei der Registrierung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-7 w-7 text-slate-800 mr-3" />
              <span className="text-xl font-semibold text-slate-900">ReiseVeteran</span>
            </div>
            <Button 
              onClick={() => setShowAuth(true)} 
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Moderne Reiseplanung für Profis
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Plane deine
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent block">
                perfekte Reise
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Budget verwalten, Aktivitäten planen und mit der Community teilen. 
              Alles in einer eleganten, professionellen Plattform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowAuth(true)}
                className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 flex items-center gap-2"
              >
                Kostenlos starten
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200"
              >
                Demo ansehen
              </Button>
            </div>
          </div>

          {/* Visual Mockup - Clean Design */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 shadow-xl border border-slate-200">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 bg-slate-100 px-4 py-2 rounded-lg text-sm text-slate-600 font-mono">
                    reiseveteran.app
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Meine Tokio Reise</h3>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Budget: €2,340 / €2,500
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Aktivitäten</div>
                      <div className="text-2xl font-bold text-slate-900">12</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Restaurants</div>
                      <div className="text-2xl font-bold text-slate-900">8</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Tage</div>
                      <div className="text-2xl font-bold text-slate-900">7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-slate-900">Perfekt geplant!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Professionelle Tools für die perfekte Reiseorganisation - elegant und einfach zu bedienen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Budget-Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Behalte dein Reisebudget im Blick mit detaillierten Kategorien und automatischen Berechnungen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Aktivitäten & Termine</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Plane Aktivitäten und Restaurantbesuche mit automatischer Kalenderansicht.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileDown className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Export & Teilen</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Exportiere deine Reisepläne als PDF oder CSV und teile sie mit der Community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Vertrauen von Reisenden weltweit
            </h2>
            <p className="text-xl text-slate-600">
              Tausende nutzen bereits ReiseVeteran für ihre perfekte Reiseplanung
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">5,000+</div>
              <div className="text-slate-600">Geplante Reisen</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">98%</div>
              <div className="text-slate-600">Zufriedene Nutzer</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">50+</div>
              <div className="text-slate-600">Länder erreicht</div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-12 text-center">
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <blockquote className="text-xl text-slate-700 mb-6 max-w-3xl mx-auto leading-relaxed">
              "ReiseVeteran hat meine Art zu reisen komplett verändert. Die intuitive Bedienung und 
              professionellen Tools machen die Reiseplanung zu einem echten Vergnügen."
            </blockquote>
            <div className="text-slate-600">
              <div className="font-semibold">Sarah M.</div>
              <div>Weltreisende aus Berlin</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für deine nächste Reise?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Starte jetzt kostenlos und erlebe, wie einfach professionelle Reiseplanung sein kann.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            className="bg-white text-slate-900 hover:bg-slate-100 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-200"
          >
            Jetzt kostenlos starten
          </Button>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="text-center border-b">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Demo: Tokio Abenteuer 2024</CardTitle>
                  <CardDescription className="text-slate-600 mt-2">
                    Erlebe die wichtigsten Funktionen live – keine Anmeldung nötig!
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDemo(false)}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeDemoTab} onValueChange={setActiveDemoTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="budget" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Budget-Management
                  </TabsTrigger>
                  <TabsTrigger value="costsharing" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Kostenteilung
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="budget" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Budget-Übersicht</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {budgetSummary.percentage}% verplant
                        </Badge>
                      </CardTitle>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Gesamtbudget:</span>
                          <span className="font-bold text-lg text-slate-900">€{budgetSummary.totalBudget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Geplante Ausgaben:</span>
                          <span className="font-mono text-slate-900">€{budgetSummary.plannedBudget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Verbleibendes Budget:</span>
                          <span className={`font-mono ${budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            €{budgetSummary.remaining.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={budgetSummary.percentage} className="h-3" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {["Transport", "Hotel", "Verpflegung", "Aktivitäten"].map((cat) => (
                          <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${categoryColors[cat]}`}></div>
                              <span className="font-medium text-slate-700">{cat}</span>
                            </div>
                            <span className="font-mono text-slate-900">
                              €{getCategoryTotal(cat).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Einzelne Budget-Posten</h4>
                        <div className="space-y-2">
                          {demoTrip.budgetItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${categoryColors[item.category]}`}></div>
                                <div>
                                  <div className="font-medium text-slate-900">{item.subcategory}</div>
                                  {item.comment && (
                                    <div className="text-xs text-slate-500 mt-1">{item.comment}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-slate-900">
                                  €{parseFloat(item.totalPrice).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.quantity} × €{parseFloat(item.unitPrice).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="costsharing" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kostenteilung-Beispiel</CardTitle>
                      <CardDescription>
                        So könnte die Abrechnung für eure Tokio-Reise aussehen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {demoReceipts.map((receipt) => (
                          <div key={receipt.id} className="border rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-slate-400" />
                                <span className="font-semibold text-slate-900">{receipt.itemName}</span>
                              </div>
                              <span className="font-mono text-lg text-slate-900">€{receipt.total.toLocaleString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-slate-600 mb-1">
                                  <span className="font-medium">Bezahlt von:</span> {receipt.payer}
                                </div>
                                <div className="text-slate-600">
                                  <span className="font-medium">Beteiligte:</span>
                                  <div className="mt-1">
                                    {receipt.persons.map((p) => (
                                      <div key={p.name} className="flex justify-between">
                                        <span className={p.isPayer ? "font-semibold text-emerald-700" : ""}>
                                          {p.name}
                                        </span>
                                        <span>{p.percent}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-slate-600">
                                  <span className="font-medium">Schulden:</span>
                                  <div className="mt-1 space-y-1">
                                    {receipt.debts.map((debt, i) => (
                                      <div key={i} className="flex justify-between text-sm">
                                        <span>{debt.from} → {debt.to}:</span>
                                        <span className="font-mono text-red-600">€{debt.amount.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                          <h4 className="font-semibold text-slate-900 mb-2">Netto-Abrechnung:</h4>
                          <div className="text-sm text-slate-700">
                            <div className="flex justify-between mb-1">
                              <span>Ben schuldet Anna insgesamt:</span>
                              <span className="font-mono text-red-600">€264</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                              (€600 - €420 + €84 = €264)
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-slate-600 mb-4">
                  Gefällt dir was du siehst? Starte jetzt kostenlos mit deiner eigenen Reiseplanung!
                </p>
                <Button 
                  onClick={() => {
                    setShowDemo(false);
                    setShowAuth(true);
                  }}
                  className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-full font-semibold"
                >
                  Jetzt kostenlos registrieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-2xl font-bold text-slate-900">Willkommen</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuth(false)}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-slate-600">
                Melde dich an oder erstelle ein neues Konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="signin" className="font-medium">Anmelden</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Registrieren</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-700 font-medium">E-Mail</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-700 font-medium">Passwort</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 rounded-lg py-3 font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500 font-medium">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full border-slate-200 hover:bg-slate-50 rounded-lg py-3 font-medium"
                    disabled={isLoading}
                  >
                    Mit Google anmelden
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-700 font-medium">E-Mail</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium">Passwort</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 rounded-lg py-3 font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Registrierung läuft..." : "Konto erstellen"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500 font-medium">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full border-slate-200 hover:bg-slate-50 rounded-lg py-3 font-medium"
                    disabled={isLoading}
                  >
                    Mit Google registrieren
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
