import { Router } from 'express';
import { DatabaseStorage } from '../storage/DatabaseStorage.js';

const router = Router();
const storage = new DatabaseStorage();

// Update user subscription status (admin only)
router.post('/update-subscription', async (req, res) => {
  try {
    const { email, subscriptionStatus } = req.body;
    
    if (!email || !subscriptionStatus) {
      return res.status(400).json({ error: 'Email and subscriptionStatus are required' });
    }
    
    // Find user by email
    const users = await storage.getAllUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update subscription status
    await storage.updateUserSubscription(user.id, subscriptionStatus);
    
    console.log(`✅ Updated ${email} to ${subscriptionStatus} plan`);
    
    res.json({ 
      success: true, 
      message: `Successfully updated ${email} to ${subscriptionStatus} plan`,
      user: {
        email: user.email,
        subscriptionStatus
      }
    });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 