import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Euro, MapPin, UtensilsCrossed, Calendar } from 'lucide-react';

interface CopyTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: CopyOptions) => void;
  trip: {
    name: string;
    budgetItems?: any[];
    activities?: any[];
    restaurants?: any[];
  };
  isLoading?: boolean;
}

export interface CopyOptions {
  copyBudgetItems: boolean;
  copyActivities: boolean;
  copyRestaurants: boolean;
}

export default function CopyTripDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trip, 
  isLoading = false 
}: CopyTripDialogProps) {
  const [copyBudgetItems, setCopyBudgetItems] = useState(true);
  const [copyActivities, setCopyActivities] = useState(true);
  const [copyRestaurants, setCopyRestaurants] = useState(true);

  const handleConfirm = () => {
    onConfirm({
      copyBudgetItems,
      copyActivities,
      copyRestaurants,
    });
  };

  const getBudgetItemsCount = () => trip.budgetItems?.length || 0;
  const getActivitiesCount = () => trip.activities?.length || 0;
  const getRestaurantsCount = () => trip.restaurants?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Reise kopieren
          </DialogTitle>
          <DialogDescription>
            Wähle aus, welche Teile von <strong>"{trip.name}"</strong> kopiert werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Budget Items */}
          <div className="flex items-center space-x-3 p-3 rounded-lg border">
            <Checkbox
              id="budget-items"
              checked={copyBudgetItems}
              onCheckedChange={setCopyBudgetItems}
              disabled={getBudgetItemsCount() === 0}
            />
            <div className="flex items-center space-x-2 flex-1">
              <Euro className="h-4 w-4 text-emerald-600" />
              <div className="flex-1">
                <Label htmlFor="budget-items" className="text-sm font-medium">
                  Budget-Positionen
                </Label>
                <p className="text-xs text-slate-500">
                  {getBudgetItemsCount() > 0 
                    ? `${getBudgetItemsCount()} Position${getBudgetItemsCount() > 1 ? 'en' : ''} gefunden`
                    : 'Keine Budget-Positionen vorhanden'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="flex items-center space-x-3 p-3 rounded-lg border">
            <Checkbox
              id="activities"
              checked={copyActivities}
              onCheckedChange={setCopyActivities}
              disabled={getActivitiesCount() === 0}
            />
            <div className="flex items-center space-x-2 flex-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <Label htmlFor="activities" className="text-sm font-medium">
                  Aktivitäten
                </Label>
                <p className="text-xs text-slate-500">
                  {getActivitiesCount() > 0 
                    ? `${getActivitiesCount()} Aktivität${getActivitiesCount() > 1 ? 'en' : ''} gefunden`
                    : 'Keine Aktivitäten vorhanden'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Restaurants */}
          <div className="flex items-center space-x-3 p-3 rounded-lg border">
            <Checkbox
              id="restaurants"
              checked={copyRestaurants}
              onCheckedChange={setCopyRestaurants}
              disabled={getRestaurantsCount() === 0}
            />
            <div className="flex items-center space-x-2 flex-1">
              <UtensilsCrossed className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <Label htmlFor="restaurants" className="text-sm font-medium">
                  Restaurants
                </Label>
                <p className="text-xs text-slate-500">
                  {getRestaurantsCount() > 0 
                    ? `${getRestaurantsCount()} Restaurant${getRestaurantsCount() > 1 ? 's' : ''} gefunden`
                    : 'Keine Restaurants vorhanden'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Kopiere...' : 'Kopieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 