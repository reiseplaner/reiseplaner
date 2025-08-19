import Stripe from 'stripe';

// Use environment variable with fallback to current test key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER_KEY_REPLACE_IN_ENV';

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export default stripe; 