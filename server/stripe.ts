import Stripe from 'stripe';

// Use environment variable with fallback to current test key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51Rb56HJxk5EsZYTy9ZpWIcfzyZS8sRj96ac7OolTXM3FJq3nhFlYfhpT615OCDwoqe7Gin27gJzxmzEsJSWn4CbP00dAJY6v2c';

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export default stripe; 