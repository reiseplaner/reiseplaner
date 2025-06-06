import { motion } from 'framer-motion';
import { Crown, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'pro' | 'veteran';
  tripsUsed: number;
  tripsLimit: number;
}

export default function UpgradePrompt({ 
  isOpen, 
  onClose, 
  currentPlan, 
  tripsUsed, 
  tripsLimit 
}: UpgradePromptProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    window.location.href = '/pricing';
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full">
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
            
            <CardTitle className="text-2xl font-bold">
              Reise-Limit erreicht!
            </CardTitle>
            
            <CardDescription className="text-base">
              Sie haben {tripsUsed} von {tripsLimit} Reisen erstellt.
              <br />
              Upgraden Sie für mehr Reisen und Premium-Features.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="text-center">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Aktueller Plan: {currentPlan.toUpperCase()}
              </Badge>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-purple-50/50 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">Pro Plan</span>
                  </div>
                  <span className="text-lg font-bold">€4,99/Monat</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bis zu 10 Reisen</li>
                  <li>• Reisen exportieren (PDF)</li>
                  <li>• Premium Support</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50/50 border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">Veteran Plan</span>
                  </div>
                  <span className="text-lg font-bold">€19,99/Monat</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unbegrenzte Reisen</li>
                  <li>• Alle Export-Funktionen</li>
                  <li>• Priority Support</li>
                  <li>• Beta-Features</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={handleUpgrade}
              >
                Jetzt upgraden
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onClose}
              >
                Später entscheiden
              </Button>
            </div>

            {/* Benefits */}
            <div className="text-center text-sm text-gray-500">
              ✓ Monatlich kündbar • ✓ Sofort verfügbar • ✓ Sichere Zahlung
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 