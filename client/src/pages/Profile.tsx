import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { 
  User, 
  Camera, 
  Crown, 
  FileText, 
  Lock, 
  Mail, 
  Calendar,
  Loader2,
  Upload,
  Trash2,
  ArrowLeft,
  Download,
  ExternalLink,
  Settings,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import PaymentMethodsTab from "@/components/PaymentMethodsTab";
import SupportDialog from "@/components/SupportDialog";

export default function Profile() {
  const { user, dbUser, signOut } = useAuth();
  
  // Check if user is signed in with Google
  const isGoogleUser = user?.identities?.some(identity => identity.provider === 'google') || false;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [cachedProfileImageUrl, setCachedProfileImageUrl] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Additional query to get the correct profile image
  const { data: profileImageData } = useQuery<{ profileImageUrl: string | null; hasProfileImage: boolean }>({
    queryKey: ['/api/auth/profile-image'],
    enabled: !!dbUser && !cachedProfileImageUrl,
    retry: false,
  });

  // Query to get subscription data
  const { data: subscriptionData } = useQuery<{
    status: string;
    billingInterval?: string;
    tripsUsed: number;
    tripsLimit: number;
    canExport: boolean;
  }>({
    queryKey: ['/api/user/subscription'],
    enabled: !!dbUser,
    retry: false,
  });

  // Query to get invoices data
  const { data: invoicesData, refetch: refetchInvoices, error: invoicesError } = useQuery<{
    invoices: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      paidAt: string | null;
      createdAt: string;
      number: string;
      description: string;
      hostedInvoiceUrl: string;
      invoicePdf: string;
      period: {
        start: string;
        end: string;
      };
    }>;
  }>({
    queryKey: ['/api/billing/invoices'],
    enabled: !!dbUser && subscriptionData?.status !== 'free',
    retry: false,
  });

  // Debug logging for invoices
  useEffect(() => {
    if (subscriptionData) {
      console.log('🔍 Subscription status:', subscriptionData.status);
      console.log('🔍 Should load invoices:', subscriptionData.status !== 'free');
      console.log('🔍 Invoices data:', invoicesData);
      console.log('🔍 Invoices error:', invoicesError);
    }
  }, [subscriptionData, invoicesData, invoicesError]);

  // Debug logging
  useEffect(() => {
    if (dbUser) {
      console.log('🔍 Debug - dbUser:', dbUser);
      console.log('🔍 Debug - profileImageUrl:', dbUser?.profileImageUrl);
      console.log('🔍 Debug - cachedProfileImageUrl:', cachedProfileImageUrl);
      console.log('🔍 Debug - profileImageData:', profileImageData);
      
      // Show the final URL that will be used
      const finalUrl = getImageUrl(dbUser?.profileImageUrl);
      console.log('🔍 Debug - final image URL:', finalUrl);
      console.log('🔍 Debug - hasProfileImage():', hasProfileImage());
      
      // Test absolute URL generation
      if (dbUser.profileImageUrl) {
        const absoluteUrl = dbUser.profileImageUrl.startsWith('http') 
          ? dbUser.profileImageUrl 
          : `${window.location.origin}${dbUser.profileImageUrl}`;
        console.log('🔍 Debug - absolute URL:', absoluteUrl);
        
        // Test if image is accessible
        fetch(absoluteUrl, { method: 'HEAD' })
          .then(response => {
            console.log('🔍 Image accessibility test:', response.status, response.statusText);
          })
          .catch(error => {
            console.error('🔴 Image accessibility test failed:', error);
          });
      }
      
      // Load cached profile image from localStorage if available and dbUser has no profileImageUrl
      if (!dbUser.profileImageUrl && !cachedProfileImageUrl) {
        const cachedUrl = localStorage.getItem(`profileImage_${dbUser.id}`);
        if (cachedUrl) {
          console.log('💾 Loading cached profile image from localStorage:', cachedUrl);
          setCachedProfileImageUrl(cachedUrl);
        }
      }
    }
  }, [dbUser, cachedProfileImageUrl, profileImageData]);

  // Helper function to get proper image URL
  const getImageUrl = (profileImageUrl: string | null | undefined): string => {
    // Priority order: 1. Cache, 2. API response, 3. dbUser, 4. empty
    const bestUrl = cachedProfileImageUrl || 
                   profileImageData?.profileImageUrl || 
                   profileImageUrl || 
                   "";
    
    if (!bestUrl) return "";
    
    // If already absolute URL, return as is
    if (bestUrl.startsWith('http')) {
      return bestUrl;
    }
    
    // Convert relative URL to absolute
    return `${window.location.origin}${bestUrl}`;
  };

  // Helper function to check if any profile image is available
  const hasProfileImage = (): boolean => {
    return !!(cachedProfileImageUrl || profileImageData?.profileImageUrl || dbUser?.profileImageUrl);
  };



  // Profile image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      console.log('🖼️ Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const response = await apiRequest("POST", "/api/auth/profile-image", formData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Upload successful:', data);
      
      // Cache the uploaded image URL immediately
      const uploadedImageUrl = data.imageUrl || data.profileImageUrl;
      setCachedProfileImageUrl(uploadedImageUrl);
      console.log('💾 Cached profile image URL:', uploadedImageUrl);
      
      // Also store in localStorage for persistence across page reloads
      if (uploadedImageUrl && dbUser?.id) {
        localStorage.setItem(`profileImage_${dbUser.id}`, uploadedImageUrl);
        console.log('💾 Saved profile image to localStorage');
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { userId: dbUser.id, imageUrl: uploadedImageUrl }
        }));
      }
      
      toast({
        title: "Profilbild aktualisiert",
        description: "Dein Profilbild wurde erfolgreich hochgeladen.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsUploadingImage(false);
    },
    onError: (error: any) => {
      console.error('🔴 Upload failed:', error);
      toast({
        title: "Fehler",
        description: error.message || "Profilbild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    },
  });

  // Password change mutation using Supabase directly
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: data.currentPassword
      });

      if (signInError) {
        throw new Error("Aktuelles Passwort ist falsch");
      }

      // Update password using Supabase client
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        throw new Error(error.message || "Passwort konnte nicht geändert werden");
      }

      return { message: "Passwort erfolgreich geändert" };
    },
    onSuccess: () => {
      toast({
        title: "Passwort geändert",
        description: "Dein Passwort wurde erfolgreich geändert.",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Passwort konnte nicht geändert werden.",
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
      toast({
        title: "Fehler",
        description: error.message || "Billing-Portal konnte nicht geöffnet werden.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account gelöscht",
        description: "Dein Account wurde erfolgreich gelöscht.",
      });
      signOut();
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Account konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Selected file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wähle eine Bilddatei aus (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Das Bild darf maximal 5MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    // Show supported formats in console for debugging
    console.log('✅ File validation passed. Supported types: JPG, PNG, GIF, WebP, etc.');
    
    setIsUploadingImage(true);
    uploadImageMutation.mutate(file);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfe deine Eingaben.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Bist du sicher, dass du deinen Account löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      deleteAccountMutation.mutate();
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Mein Profil</h1>
          <p className="text-slate-600 mt-2">Verwalte deine Account-Einstellungen und Präferenzen</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="subscription">Abo & Billing</TabsTrigger>
            <TabsTrigger value="payment">Zahlungsmethoden</TabsTrigger>
            <TabsTrigger value="security">Sicherheit</TabsTrigger>
            <TabsTrigger value="danger">Account</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil-Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={cachedProfileImageUrl || getImageUrl(dbUser?.profileImageUrl) || ""} 
                        alt={`${dbUser?.firstName} ${dbUser?.lastName}`} 
                        onError={(e) => {
                          console.error('🔴 Profilbild konnte nicht geladen werden:', dbUser?.profileImageUrl);
                        }}
                        onLoad={() => {
                          console.log('✅ Profilbild erfolgreich geladen:', dbUser?.profileImageUrl);
                        }}
                      />
                      <AvatarFallback className="text-lg">
                        {getInitials(dbUser?.firstName, dbUser?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="profile-image-upload"
                      className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                      title="Profilbild ändern"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </label>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {dbUser?.firstName} {dbUser?.lastName}
                    </h3>
                    <p className="text-slate-600">@{dbUser?.username || "Kein Username"}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Klicke auf das Kamera-Symbol, um dein Profilbild zu ändern
                    </p>
                    {!hasProfileImage() && (
                      <p className="text-xs text-amber-600 mt-1">
                        💡 Noch kein Profilbild hochgeladen
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>E-Mail-Adresse</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900">{user?.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Mitglied seit</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-900">
                        {dbUser?.createdAt ? formatDate(dbUser.createdAt) : "Unbekannt"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Abo-Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={subscriptionData?.status === 'free' ? 'secondary' : 'default'}>
                        {subscriptionData?.status === 'free' ? 'Kostenlos' : 
                         subscriptionData?.status === 'pro' ? 'Pro' : 
                         subscriptionData?.status === 'veteran' ? 'Veteran' : 'Unbekannt'}
                      </Badge>
                      <span className="font-medium">
                        {subscriptionData?.status === 'free' ? 'Free Plan' : 
                         subscriptionData?.status === 'pro' ? 'Pro Plan' : 
                         subscriptionData?.status === 'veteran' ? 'Veteran Plan' : 'Unbekannter Plan'}
                      </span>
                      {subscriptionData?.billingInterval && (
                        <Badge variant="outline">
                          {subscriptionData.billingInterval === 'monthly' ? 'Monatlich' : 'Jährlich'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {subscriptionData?.status === 'free' ? 'Grundlegende Features für Reiseplanung' :
                       subscriptionData?.status === 'pro' ? 'Erweiterte Features für Reiseplanung' :
                       subscriptionData?.status === 'veteran' ? 'Alle Premium Features inklusive' : 
                       'Status wird geladen...'}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Reisen: {subscriptionData?.tripsUsed || 0} / {subscriptionData?.status === 'veteran' ? '∞' : subscriptionData?.tripsLimit || 0}
                    </p>
                  </div>
                  {subscriptionData?.status === 'free' && (
                    <Button onClick={() => setLocation('/pricing')}>
                      Upgrade zu Premium
                    </Button>
                  )}
                  {subscriptionData?.status !== 'free' && (
                    <Button variant="outline" onClick={() => setLocation('/pricing')}>
                      Plan verwalten
                    </Button>
                  )}
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-medium mb-3">
                    {subscriptionData?.status === 'free' ? 'Premium Features' : 'Deine Features'}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {subscriptionData?.status === 'free' ? (
                      <>
                        <li>• Unbegrenzte Reisepläne</li>
                        <li>• Erweiterte Budget-Analyse</li>
                        <li>• Priority Support</li>
                        <li>• PDF Export</li>
                        <li>• Erweiterte Community-Features</li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {subscriptionData?.tripsLimit === Infinity ? 'Unbegrenzte Reisepläne' : `Bis zu ${subscriptionData?.tripsLimit} Reisepläne`}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          Erweiterte Budget-Analyse
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {subscriptionData?.canExport ? 'PDF Export verfügbar' : 'PDF Export nicht verfügbar'}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          Priority Support
                        </li>
                        {subscriptionData?.status === 'veteran' && (
                          <>
                            <li className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              Erweiterte Kostenteilung
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              Beta-Features
                            </li>
                          </>
                        )}
                      </>
                    )}
                  </ul>
                </div>

                {/* Support Section for Pro/Veteran users */}
                {subscriptionData?.status !== 'free' && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Premium Support
                      </h4>
                      <p className="text-sm text-slate-600 mb-4">
                        Als {subscriptionData?.status === 'pro' ? 'Pro' : 'Veteran'}-Nutzer hast du Zugang zu unserem Premium Support. 
                        Kontaktiere uns bei Fragen oder Problemen.
                      </p>
                      <SupportDialog>
                        <Button variant="outline" className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Support kontaktieren
                        </Button>
                      </SupportDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Rechnungen
                  </div>
                  {subscriptionData?.status !== 'free' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => billingPortalMutation.mutate()}
                      disabled={billingPortalMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {billingPortalMutation.isPending ? 'Öffne...' : 'Billing verwalten'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionData?.status === 'free' ? (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Du hast noch keine Rechnungen. Upgrade zu Premium, um deine Rechnungshistorie zu sehen.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {!invoicesData?.invoices || invoicesData.invoices.length === 0 ? (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Noch keine Rechnungen vorhanden. Deine ersten Rechnungen werden hier angezeigt, sobald sie verfügbar sind.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-slate-600 mb-4">
                          {invoicesData.invoices.length} Rechnung{invoicesData.invoices.length !== 1 ? 'en' : ''} gefunden
                        </div>
                        {invoicesData.invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {invoice.number || `#${invoice.id.slice(-8)}`}
                                </Badge>
                                <Badge 
                                  variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                                  className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {invoice.status === 'paid' ? 'Bezahlt' : invoice.status}
                                </Badge>
                              </div>
                              <div className="font-medium text-slate-900">
                                {invoice.description}
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                {new Date(invoice.period.start).toLocaleDateString('de-DE')} - {new Date(invoice.period.end).toLocaleDateString('de-DE')}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Bezahlt am: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('de-DE') : 'N/A'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-semibold text-slate-900">
                                  €{invoice.amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-500 uppercase">
                                  {invoice.currency}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Ansehen
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(invoice.invoicePdf, '_blank')}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment" className="space-y-6">
            <PaymentMethodsTab />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Passwort ändern
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGoogleUser ? (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Du hast dich mit Google angemeldet. Dein Passwort wird über dein Google-Konto verwaltet. 
                      Um dein Passwort zu ändern, besuche die{" "}
                      <a 
                        href="https://myaccount.google.com/security" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Google-Kontosicherheit
                      </a>.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Aktuelles Passwort</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Neues Passwort</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Passwort wird geändert...
                        </>
                      ) : (
                        "Passwort ändern"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-red-200 bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Das Löschen deines Accounts ist permanent und kann nicht rückgängig gemacht werden. 
                    Alle deine Reisepläne, Daten und Einstellungen werden unwiderruflich gelöscht.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6">
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Account wird gelöscht...
                      </>
                    ) : (
                      "Account löschen"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
} 