export type SubscriptionStatus = 'free' | 'pro' | 'veteran';
export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  billingInterval?: BillingInterval;
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
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  tripsLimit: number;
  canExport: boolean;
  features: string[];
  yearlyDiscount?: string;
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
    monthlyPrice: 0,
    yearlyPrice: 0,
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
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    currency: 'EUR',
    tripsLimit: 10,
    canExport: true,
    yearlyDiscount: '2 Monate Gratis!',
    features: [
      'Bis zu 10 Reisen',
      'Interaktiver Reise-Kalender',
      'Reisen exportieren (PDF)',
      'Erweiterte Budgettools',
      'Premium Support',
    ],
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran Plan',
    monthlyPrice: 19.99,
    yearlyPrice: 199.90,
    currency: 'EUR',
    tripsLimit: Infinity,
    canExport: true,
    yearlyDiscount: '2 Monate Gratis!',
    features: [
      'Unbegrenzte Reisen',
      'Erweiterte Kostenteilung mit Belegerstellung',
      'Alle Export-Funktionen',
      'Erweiterte Statistiken',
      'Priority Support',
      'Beta-Features',
    ],
  },
};

export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  veteran_monthly: process.env.STRIPE_VETERAN_MONTHLY_PRICE_ID || 'price_veteran_monthly',
  veteran_yearly: process.env.STRIPE_VETERAN_YEARLY_PRICE_ID || 'price_veteran_yearly',
}; 