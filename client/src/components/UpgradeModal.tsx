import React from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'calendar' | 'export';
}

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [, setLocation] = useLocation();

  if (!isOpen) return null;

  const featureInfo = {
    calendar: {
      title: 'Kalender-Funktion freischalten',
      description: 'Organisieren Sie Ihre Reiseaktivitäten mit unserem interaktiven Kalender',
      icon: <Sparkles className="h-8 w-8 text-purple-500" />,
    },
    export: {
      title: 'Export-Funktion freischalten',
      description: 'Exportieren Sie Ihre Reisepläne als PDF für offline Zugriff',
      icon: <Crown className="h-8 w-8 text-yellow-500" />,
    },
  };

  const currentFeature = featureInfo[feature];

  const handleUpgrade = () => {
    setLocation('/pricing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentFeature.icon}
                <CardTitle className="text-xl font-bold">
                  {currentFeature.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-gray-600">
              {currentFeature.description}
            </p>

            {/* Premium Features List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Pro Plan Vorteile:</h4>
              <div className="space-y-2">
                {[
                  'Bis zu 10 Reisen planen',
                  'Interaktiver Reise-Kalender',
                  'PDF Export aller Reisepläne',
                  'Erweiterte Budgettools',
                  'Premium Support'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                €4.99<span className="text-sm font-normal text-gray-600">/Monat</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Später
              </Button>
              <Button
                onClick={handleUpgrade}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Jetzt upgraden
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 