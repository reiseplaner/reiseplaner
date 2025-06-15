export type SubscriptionStatus = 'free' | 'pro' | 'veteran';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expiresAt?: string;
  tripsUsed: number;
  tripsLimit: number;
  canExport: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface SubscriptionPlan {
  id: SubscriptionStatus;
  name: string;
  price: number;
  currency: string;
  tripsLimit: number;
  canExport: boolean;
  features: string[];
}

export const SUBSCRIPTION_LIMITS = {
  free: {
    tripsLimit: 1,
    canExport: false,
  },
  pro: {
    tripsLimit: 10,
    canExport: true,
  },
  veteran: {
    tripsLimit: Infinity,
    canExport: true,
  },
} as const;

export const SUBSCRIPTION_PLANS: Record<SubscriptionStatus, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Standard',
    price: 0,
    currency: 'EUR',
    tripsLimit: 1,
    canExport: false,
    features: [
      'Bis zu 1 Reise',
      'Basis Budgetplanung',
      'Restaurant & Aktivitäten Planer',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 4.99,
    currency: 'EUR',
    tripsLimit: 10,
    canExport: true,
    features: [
      'Bis zu 10 Reisen',
      'Reisen exportieren (PDF)',
      'Erweiterte Budgettools',
      'Premium Support',
    ],
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran Plan',
    price: 19.99,
    currency: 'EUR',
    tripsLimit: Infinity,
    canExport: true,
    features: [
      'Unbegrenzte Reisen',
      'Alle Export-Funktionen',
      'Erweiterte Statistiken',
      'Priority Support',
      'Beta-Features',
    ],
  },
};

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  veteran: process.env.STRIPE_VETERAN_PRICE_ID || 'price_veteran_monthly',
}; 