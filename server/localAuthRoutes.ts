import type { Express } from "express";
import { signInWithEmail, signUpWithEmail, localAuth } from "./localAuth";
import { storage } from "./storage";

export function registerLocalAuthRoutes(app: Express) {
  // Local authentication routes
  app.post('/api/auth/local/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
      }

      const result = await signInWithEmail(email, password);
      
      res.json({
        user: result.user,
        access_token: result.token,
        success: true
      });
    } catch (error) {
      console.error('Local signin error:', error);
      res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }
  });

  app.post('/api/auth/local/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }

      const result = await signUpWithEmail(email, password);
      
      res.json({
        user: result.user,
        access_token: result.token,
        success: true
      });
    } catch (error) {
      console.error('Local signup error:', error);
      if (error.message === 'User already exists') {
        return res.status(409).json({ message: 'Benutzer existiert bereits' });
      }
      res.status(500).json({ message: 'Fehler bei der Registrierung' });
    }
  });

  // Demo login route for easy testing
  app.post('/api/auth/local/demo', async (req, res) => {
    try {
      // Create or get a demo user
      const demoEmail = 'demo@reiseveteran.com';
      let demoUser = await storage.getUserByEmail(demoEmail);
      
      if (!demoUser) {
        demoUser = await storage.upsertUser({
          id: 'demo-user-1',
          email: demoEmail,
          username: 'demo_user',
          firstName: 'Demo',
          lastName: 'User',
          subscriptionStatus: 'pro' // Give demo user pro features
        });
      }

      const result = await signInWithEmail(demoEmail, 'demo');
      
      res.json({
        user: result.user,
        access_token: result.token,
        success: true
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Fehler beim Demo-Login' });
    }
  });

  // Get current user info (replacement for Supabase auth/user)
  app.get('/api/auth/user', localAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ message: 'Fehler beim Laden des Benutzers' });
    }
  });
}