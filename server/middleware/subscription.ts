import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Erweitere den Request type um subscription info
declare module 'express' {
  interface Request {
    subscriptionInfo?: {
      status: string;
      tripsUsed: number;
      tripsLimit: number;
      canExport: boolean;
    };
  }
}

// Middleware um die Trip-Erstellung zu überprüfen
export async function checkTripLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const canCreate = await storage.canCreateTrip(userId);
    
    if (!canCreate.allowed) {
      return res.status(403).json({
        message: canCreate.reason,
        limitReached: true,
        currentPlan: canCreate.currentPlan,
        upgradeRequired: true,
      });
    }

    // Füge Subscription-Info zum Request hinzu
    const subscriptionInfo = await storage.getUserSubscriptionStatus(userId);
    req.subscriptionInfo = subscriptionInfo;
    
    next();
  } catch (error) {
    console.error('Error checking trip limit:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
}

// Middleware um Export-Berechtigung zu überprüfen
export async function checkExportPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const canExport = await storage.canExportTrip(userId);
    
    if (!canExport) {
      return res.status(403).json({
        message: 'Export-Funktion ist nur für Pro und Veteran Nutzer verfügbar',
        upgradeRequired: true,
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking export permission:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
} 