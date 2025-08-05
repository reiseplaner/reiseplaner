import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCookies } from '@/contexts/CookieContext';
import { Settings, Cookie, Shield, BarChart3, Target } from 'lucide-react';

export default function CookieBanner() {
  const { showBanner, preferences, acceptAll, rejectAll, updatePreferences, hideBanner } = useCookies();
  const [showSettings, setShowSettings] = useState(false);
  const [tempPreferences, setTempPreferences] = useState(preferences);

  if (!showBanner) return null;

  const handleSaveSettings = () => {
    updatePreferences(tempPreferences);
    setShowSettings(false);
    hideBanner();
  };

  const handleAcceptAll = () => {
    acceptAll();
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-[9999]">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cookie className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Cookie-Einstellungen</CardTitle>
          </div>
          <CardDescription>
            Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showSettings ? (
            // Simple Banner
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Diese Website verwendet Cookies für notwendige Funktionen und, mit Ihrer Einwilligung, 
                für Analysen zur Verbesserung unserer Dienste.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAcceptAll} className="flex-1">
                  Alle akzeptieren
                </Button>
                <Button onClick={handleRejectAll} variant="outline" className="flex-1">
                  Nur notwendige
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="ghost" 
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Einstellungen</span>
                </Button>
              </div>
            </div>
          ) : (
            // Detailed Settings
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-900">Notwendige Cookies</label>
                      <Checkbox checked={true} disabled />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-900">Analyse-Cookies</label>
                      <Checkbox 
                        checked={tempPreferences.analytics}
                        onCheckedChange={(checked) => 
                          setTempPreferences(prev => ({ ...prev, analytics: checked as boolean }))
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren. 
                      Alle Informationen werden anonymisiert gesammelt.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-900">Marketing-Cookies</label>
                      <Checkbox 
                        checked={tempPreferences.marketing}
                        onCheckedChange={(checked) => 
                          setTempPreferences(prev => ({ ...prev, marketing: checked as boolean }))
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Diese Cookies werden verwendet, um Ihnen relevante Werbung und personalisierte Inhalte zu zeigen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Einstellungen speichern
                </Button>
                <Button onClick={handleAcceptAll} variant="outline" className="flex-1">
                  Alle akzeptieren
                </Button>
                <Button onClick={() => setShowSettings(false)} variant="ghost">
                  Zurück
                </Button>
              </div>
            </div>
          )}
          
          <div className="border-t pt-4 text-xs text-gray-500">
            Weitere Informationen finden Sie in unserer{' '}
            <a href="/datenschutz" className="text-primary hover:underline">
              Datenschutzerklärung
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 