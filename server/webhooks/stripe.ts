import { Request, Response } from 'express';
import stripe from '../stripe';
import { storage } from '../storage';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  
  // For testing, we'll temporarily disable webhook signature verification
  // In production, you MUST enable this!
  const STRIPE_WEBHOOK_SECRET = 'whsec_test_your_webhook_secret_here'; // Replace with actual secret
  
  let event;

  if (sig && STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET !== 'whsec_test_your_webhook_secret_here') {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // For testing without proper webhook setup, parse the body directly
    console.log('⚠️ Using webhook without signature verification (TEST MODE ONLY)');
    event = req.body;
  }

  console.log('✅ Received Stripe webhook:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`🤷‍♀️ Unhandled event type ${event.type}`);
  }

  res.status(200).send('Success');
};

async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('💳 Processing checkout session completed:', session.id);
    
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingInterval = session.metadata?.billingInterval;
    
    if (!userId || !planId) {
      console.error('❌ Missing metadata in checkout session');
      return;
    }

    // Get the subscription from Stripe
    const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Calculate expiration date
    const expiresAt = new Date((subscriptionResponse as any).current_period_end * 1000).toISOString();
    
          // Update user subscription
      await storage.updateUserSubscription(
        userId,
        planId as any,
        expiresAt,
        session.customer as string,
        subscriptionResponse.id
      );

    // Update billing interval if provided
    if (billingInterval) {
      const user = await storage.getUser(userId);
      if (user) {
        // Note: You might need to extend updateUserSubscription to handle billingInterval
        console.log(`✅ Updated user ${userId} to ${planId} plan (${billingInterval})`);
      }
    }

    console.log(`✅ Successfully updated subscription for user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('💰 Processing invoice payment succeeded:', invoice.id);
    
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customerId = subscription.customer as string;
      
      // Find user by Stripe customer ID
      const users = await storage.getAllUsers();
      const user = users.find(u => u.stripeCustomerId === customerId);
      
      if (user) {
        // Update subscription expiration
        const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString();
        await storage.updateUserSubscription(
          user.id,
          user.subscriptionStatus as any,
          expiresAt,
          customerId,
          subscription.id
        );
        console.log(`✅ Updated subscription expiration for user ${user.id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Processing subscription updated:', subscription.id);
    
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.stripeCustomerId === customerId);
    
    if (user) {
      // Determine plan based on subscription items
      let planId = 'free';
      if (subscription.items && subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        
        // Map price ID to plan ID
        for (const [key, value] of Object.entries(process.env)) {
          if (value === priceId) {
            if (key.includes('PRO')) planId = 'pro';
            else if (key.includes('VETERAN')) planId = 'veteran';
          }
        }
      }
      
      const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
      
      await storage.updateUserSubscription(
        user.id,
        planId as any,
        expiresAt,
        customerId,
        subscription.id
      );
      
      console.log(`✅ Updated subscription for user ${user.id} to ${planId}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('❌ Processing subscription deleted:', subscription.id);
    
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    const users = await storage.getAllUsers();
    const user = users.find(u => u.stripeCustomerId === customerId);
    
    if (user) {
      // Downgrade to free plan
      await storage.updateUserSubscription(
        user.id,
        'free',
        undefined,
        customerId,
        undefined
      );
      
      console.log(`✅ Downgraded user ${user.id} to free plan`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error);
  }
} 