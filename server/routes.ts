import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type Stripe from "stripe";
import { supabaseAuth, supabase } from "./supabaseAuth";
import {
  insertTripSchema,
  insertBudgetItemSchema,
  insertActivitySchema,
  insertRestaurantSchema,
  insertCostSharingReceiptSchema,
  users,
} from "../shared/schema";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { checkTripLimit, checkExportPermission } from './middleware/subscription';
import { SUBSCRIPTION_PLANS, STRIPE_PRICE_IDS } from './types/subscription';
import stripe from './stripe';
import { handleStripeWebhook } from './webhooks/stripe';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt!') as any, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Debug route to check uploads directory
  app.get('/api/debug/uploads', async (req, res) => {
    try {
      const uploadsPath = path.join(process.cwd(), 'uploads');
      const profilesPath = path.join(uploadsPath, 'profiles');
      
      console.log('🔍 Debug uploads check:');
      console.log('  - Uploads path:', uploadsPath);
      console.log('  - Profiles path:', profilesPath);
      
      const result: {
        uploadsExists: boolean;
        profilesExists: boolean;
        uploadsPath: string;
        profilesPath: string;
        files: Array<{ name: string; size: number; url: string }>;
      } = {
        uploadsExists: fs.existsSync(uploadsPath),
        profilesExists: fs.existsSync(profilesPath),
        uploadsPath,
        profilesPath,
        files: []
      };
      
      if (fs.existsSync(profilesPath)) {
        result.files = fs.readdirSync(profilesPath).map(file => {
          const filePath = path.join(profilesPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            url: `/uploads/profiles/${file}`
          };
        });
      }
      
      console.log('🔍 Debug result:', result);
      res.json(result);
    } catch (error: any) {
      console.error('🔴 Debug uploads error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth routes
  app.get('/api/auth/user', supabaseAuth, async (req: any, res) => {
    try {
      const supabaseUser = req.user;
      
      // First, check if user already exists in our database
      let dbUser = await storage.getUser(supabaseUser.id);
      
      if (!dbUser) {
        // User doesn't exist, create new user with Supabase metadata
        console.log(`🔧 Creating new user ${supabaseUser.id} in database`);
        console.log(`🔧 Using Supabase avatar: ${supabaseUser.user_metadata?.avatar_url || 'none'}`);
        dbUser = await storage.upsertUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || null,
          lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
        });
      } else {
        // User exists, only update basic info but preserve profileImageUrl
        console.log(`🔧 Updating existing user ${supabaseUser.id} (preserving profileImageUrl)`);
        console.log(`🔧 Preserving existing profileImageUrl: ${dbUser.profileImageUrl || 'none'}`);
        dbUser = await storage.upsertUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || dbUser.firstName,
          lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl, // Preserve existing profileImageUrl
        });
      }
      
      console.log(`🔍 Auth /user response for ${supabaseUser.id}:`, {
        id: dbUser.id,
        email: dbUser.email,
        profileImageUrl: dbUser.profileImageUrl,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName
      });
      
      // Return the database user info, not the Supabase user
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Upload profile image
  app.post('/api/auth/profile-image', supabaseAuth, upload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen" });
      }

      console.log(`🖼️ Uploading profile image for user ${userId}: ${req.file.filename}`);

      // Generate URL for the uploaded file
      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      // Update user's profile image URL in database
      const updatedUser = await storage.updateUserProfileImage(userId, imageUrl);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile image" });
      }

      console.log(`✅ Profile image updated for user ${userId}: ${imageUrl}`);
      
      // Force invalidate React Query cache to show the update immediately
      res.json({ 
        message: "Profilbild erfolgreich hochgeladen", 
        user: updatedUser,
        imageUrl,
        profileImageUrl: imageUrl, // Make sure both fields are provided
        success: true
      });
    } catch (error) {
      console.error("🔴 Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Get current profile image URL
  app.get('/api/auth/profile-image', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      console.log(`🔍 Getting profile image for user ${userId}: ${user?.profileImageUrl || 'none'}`);
      
      res.json({ 
        profileImageUrl: user?.profileImageUrl || null,
        hasProfileImage: !!user?.profileImageUrl
      });
    } catch (error) {
      console.error("🔴 Error getting profile image:", error);
      res.status(500).json({ message: "Failed to get profile image" });
    }
  });

  // Admin route to update subscription status
  app.post('/api/admin/update-subscription', async (req, res) => {
    try {
      const { email, subscriptionStatus } = req.body;
      
      if (!email || !subscriptionStatus) {
        return res.status(400).json({ error: 'Email and subscriptionStatus are required' });
      }
      
      // Find user by email
      const users = await storage.getAllUsers();
      const user = users.find((u: any) => u.email === email);
      
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

  // Change password
  app.post('/api/auth/change-password', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      console.log(`🔐 Changing password for user ${userId}`);

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Aktuelles und neues Passwort sind erforderlich" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "Neues Passwort muss mindestens 6 Zeichen lang sein" 
        });
      }

      // Check if user is a Google OAuth user (cannot change password)
      const user = req.user;
      const isGoogleUser = user.identities?.some((identity: any) => identity.provider === 'google');
      
      if (isGoogleUser) {
        console.log(`🔴 User ${userId} is a Google user, cannot change password`);
        return res.status(400).json({ 
          message: "Passwort kann nicht geändert werden. Du hast dich mit Google angemeldet." 
        });
      }

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        console.error("🔴 Current password verification failed:", signInError);
        return res.status(400).json({ 
          message: "Aktuelles Passwort ist falsch" 
        });
      }

      // Since we can't use admin functions with anon key, we'll need the user to 
      // change their password on the client side or implement proper service role key
      // For now, return a helpful error message
      console.log(`🔴 Password change not supported on server side with current setup`);
      return res.status(400).json({ 
        message: "Passwort-Änderung ist derzeit nur auf der Client-Seite möglich. Bitte verwende die Passwort-Zurücksetzen-Funktion." 
      });
    } catch (err) {
      console.error("🔴 Error changing password:", err);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Check username availability
  app.get('/api/auth/username/:username/available', async (req, res) => {
    try {
      const { username } = req.params;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ 
          available: false, 
          message: "Username muss mindestens 3 Zeichen lang sein" 
        });
      }

      // Check for valid characters (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({ 
          available: false, 
          message: "Username darf nur Buchstaben, Zahlen, _ und - enthalten" 
        });
      }

      const isAvailable = await storage.checkUsernameAvailability(username);
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking username availability:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Set username
  app.post('/api/auth/username', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      
      console.log(`🔧 Setting username for user ${userId}: ${username}`);
      
      if (!username || username.length < 3) {
        console.log(`🔴 Invalid username length: ${username?.length || 0}`);
        return res.status(400).json({ 
          message: "Username muss mindestens 3 Zeichen lang sein" 
        });
      }

      // Check for valid characters
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        console.log(`🔴 Invalid username characters: ${username}`);
        return res.status(400).json({ 
          message: "Username darf nur Buchstaben, Zahlen, _ und - enthalten" 
        });
      }

      // Check availability
      console.log(`🔍 Checking username availability: ${username}`);
      const isAvailable = await storage.checkUsernameAvailability(username);
      console.log(`🔍 Username available: ${isAvailable}`);
      
      if (!isAvailable) {
        console.log(`🔴 Username not available: ${username}`);
        return res.status(400).json({ 
          message: "Username ist bereits vergeben" 
        });
      }

      // Ensure user exists in database first
      console.log(`🔧 Ensuring user exists in database: ${userId}`);
      let existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log(`🔧 User not found, creating user: ${userId}`);
        // Create user first
        existingUser = await storage.upsertUser({
          id: userId,
          email: req.user.email,
          firstName: req.user.user_metadata?.full_name?.split(' ')[0] || null,
          lastName: req.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          profileImageUrl: req.user.user_metadata?.avatar_url || null,
        });
        console.log(`🔧 User created:`, existingUser);
      }

      console.log(`🔧 Updating username for user: ${userId}`);
      const updatedUser = await storage.updateUserUsername(userId, username);
      console.log(`🔧 Updated user:`, updatedUser);
      
      if (!updatedUser) {
        console.error(`🔴 Failed to update username for user: ${userId} - No user returned from update`);
        // Try to get the user again to see if it exists
        const userCheck = await storage.getUser(userId);
        console.log(`🔧 User check after failed update:`, userCheck);
        return res.status(500).json({ message: "Benutzer konnte nicht aktualisiert werden" });
      }

      console.log(`✅ Username set successfully for user ${userId}: ${username}`);
      res.json({ message: "Username erfolgreich gesetzt", user: updatedUser });
    } catch (error) {
      console.error("🔴 Error setting username:", error);
      res.status(500).json({ message: "Failed to set username" });
    }
  });

  // Delete current user
  app.delete('/api/auth/user', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      console.log("🗑️ Deleting user:", userId);
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      console.log("✅ User deleted successfully:", userId);
      res.json({ message: "Benutzer erfolgreich gelöscht" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Stripe webhook (must be before body parsing middleware)
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

  // Removed problematic checkout verify endpoint - using the one below with simpler updateSubscription

  // Subscription routes
  app.get('/api/user/subscription', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptionInfo = await storage.getUserSubscriptionStatus(userId);
      
      res.json(subscriptionInfo);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/subscription/plans', async (req, res) => {
    try {
      res.json(SUBSCRIPTION_PLANS);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Removed duplicate create-checkout endpoint - using the one below with proper logging

  // Export permission check (for future PDF export feature)
  app.get('/api/user/can-export', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const canExport = await storage.canExportTrip(userId);
      
      res.json({ canExport });
    } catch (error) {
      console.error('Error checking export permission:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Trip routes
  app.get('/api/trips', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trips = await storage.getTripsByUserId(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get('/api/trips/:id', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.id);
      
      console.log("🔍 GET /api/trips/:id Request:");
      console.log("🔍 Trip ID:", tripId, "Type:", typeof tripId);
      console.log("🔍 User ID:", userId);
      
      const trip = await storage.getTripById(tripId, userId);
      
      console.log("🔍 Trip loaded from database:");
      console.log("🔍 Trip exists:", !!trip);
      if (trip) {
        console.log("🔍 Trip ID:", trip.id);
        console.log("🔍 Budget Items count:", trip.budgetItems?.length || 0);
        console.log("🔍 Activities count:", trip.activities?.length || 0);
        console.log("🔍 Restaurants count:", trip.restaurants?.length || 0);
        console.log("🔍 Budget Items:", trip.budgetItems);
      }
      
      if (!trip) {
        console.log("🔴 Trip not found for user:", userId, "tripId:", tripId);
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("🔴 Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post('/api/trips', supabaseAuth, checkTripLimit, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripData = insertTripSchema.parse({ ...req.body, userId });
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.put('/api/trips/:id', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.id);
      console.log("Received trip update data:", req.body);
      const tripData = insertTripSchema.partial().parse(req.body);
      console.log("Parsed trip data:", tripData);
      const trip = await storage.updateTrip(tripId, tripData, userId);
      console.log("Updated trip from database:", trip);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.delete('/api/trips/:id', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.id);
      const success = await storage.deleteTrip(tripId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Share trip route
  app.post('/api/trips/:id/share', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.id);
      const { description } = req.body;
      
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: "Beschreibung ist erforderlich" });
      }
      
      // Check if trip exists and belongs to user
      const existingTrip = await storage.getTripById(tripId, userId);
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Generate a unique public slug
      const baseSlug = existingTrip.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      const timestamp = Date.now().toString(36);
      const publicSlug = `${baseSlug}-${timestamp}`;
      
      // Update trip to make it public
      const updatedTrip = await storage.updateTrip(tripId, {
        isPublic: true,
        publicSlug: publicSlug,
        description: description.trim()
      }, userId);
      
      if (!updatedTrip) {
        return res.status(500).json({ message: "Failed to share trip" });
      }
      
      res.json({ 
        message: "Trip successfully shared with community",
        publicSlug: publicSlug,
        trip: updatedTrip
      });
    } catch (error) {
      console.error("Error sharing trip:", error);
      res.status(500).json({ message: "Failed to share trip" });
    }
  });

  // Public trip routes
  app.get('/api/public/trips', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trips = await storage.getPublicTrips(limit);
      
      // Add upvote counts to each trip
      const tripsWithUpvotes = await Promise.all(
        trips.map(async (trip) => {
          const upvoteCount = await storage.getTripUpvoteCount(trip.id);
          return { ...trip, upvoteCount };
        })
      );
      
      res.json(tripsWithUpvotes);
    } catch (error) {
      console.error("Error fetching public trips:", error);
      res.status(500).json({ message: "Failed to fetch public trips" });
    }
  });

  app.get('/api/public/trips/:slug', async (req, res) => {
    try {
      const trip = await storage.getTripBySlug(req.params.slug);
      
      if (!trip) {
        return res.status(404).json({ message: "Public trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching public trip:", error);
      res.status(500).json({ message: "Failed to fetch public trip" });
    }
  });

  // Get public trip with community features (upvotes, comments)
  app.get('/api/public/trips/:slug/community', async (req: any, res) => {
    try {
      // For now, we'll get the trip without user-specific data
      // TODO: Add optional auth support later
      const trip = await storage.getPublicTripWithCommunityFeatures(req.params.slug);
      
      if (!trip) {
        return res.status(404).json({ message: "Public trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching public trip with community features:", error);
      res.status(500).json({ message: "Failed to fetch public trip" });
    }
  });

  // Upvote/downvote trip
  app.post('/api/public/trips/:slug/upvote', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const trip = await storage.getTripBySlug(req.params.slug);
      
      if (!trip) {
        return res.status(404).json({ message: "Public trip not found" });
      }

      const hasUpvoted = await storage.hasUserUpvoted(trip.id, userId);
      
      if (hasUpvoted) {
        // Remove upvote
        await storage.removeUpvote(trip.id, userId);
        const upvoteCount = await storage.getTripUpvoteCount(trip.id);
        res.json({ upvoted: false, upvoteCount });
      } else {
        // Add upvote
        await storage.upvoteTrip(trip.id, userId);
        const upvoteCount = await storage.getTripUpvoteCount(trip.id);
        res.json({ upvoted: true, upvoteCount });
      }
    } catch (error) {
      console.error("Error toggling upvote:", error);
      res.status(500).json({ message: "Failed to toggle upvote" });
    }
  });

  // Add comment to trip
  app.post('/api/public/trips/:slug/comments', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Kommentar darf nicht leer sein" });
      }

      const trip = await storage.getTripBySlug(req.params.slug);
      
      if (!trip) {
        return res.status(404).json({ message: "Public trip not found" });
      }

      const comment = await storage.addTripComment({
        tripId: trip.id,
        userId,
        content: content.trim(),
      });

      // Get the comment with user data
      const comments = await storage.getTripComments(trip.id);
      const newComment = comments.find(c => c.id === comment.id);

      res.json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Delete comment
  app.delete('/api/comments/:id', supabaseAuth, async (req: any, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const success = await storage.deleteTripComment(commentId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found or not authorized" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Budget item routes
  app.post('/api/trips/:tripId/budget-items', supabaseAuth, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const userId = req.user.id;
      
      console.log("🔵 Create Budget Item Request:");
      console.log("🔵 Trip ID:", tripId, "Type:", typeof tripId);
      console.log("🔵 User ID:", userId);
      console.log("🔵 Request Body:", req.body);
      
      // Validiere tripId
      if (isNaN(tripId)) {
        console.log("🔴 Invalid trip ID:", req.params.tripId);
        return res.status(400).json({ message: "Invalid trip ID" });
      }
      
      // Prüfen, ob die Reise existiert und dem Benutzer gehört
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) {
        console.log("🔴 Trip not found or user not authorized:", tripId);
        return res.status(404).json({ message: "Trip not found or not authorized" });
      }
      
      const budgetItemData = insertBudgetItemSchema.parse({ ...req.body, tripId });
      console.log("🔵 Parsed budget item data:", budgetItemData);
      
      const budgetItem = await storage.createBudgetItem(budgetItemData);
      console.log("🟢 Created budget item:", budgetItem);
      
      res.json(budgetItem);
    } catch (error) {
      console.error("🔴 Error creating budget item:", error);
      if (error instanceof z.ZodError) {
        console.error("🔴 Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Invalid budget item data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put('/api/budget-items/:id', supabaseAuth, async (req: any, res) => {
    try {
      const budgetItemId = parseInt(req.params.id);
      const userId = req.user.id;
      
      console.log("🔵 Update Budget Item Request:");
      console.log("🔵 Budget Item ID:", budgetItemId);
      console.log("🔵 User ID:", userId);
      console.log("🔵 Request Body:", req.body);
      
      // Erst prüfen, ob das Budget-Item existiert und dem Benutzer gehört
      const existingItem = await storage.getBudgetItemById(budgetItemId);
      if (!existingItem) {
        console.log("🔴 Budget item not found:", budgetItemId);
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      // Prüfen, ob das Budget-Item zu einer Reise des Benutzers gehört
      const trip = await storage.getTripById(existingItem.tripId, userId);
      if (!trip) {
        console.log("🔴 User not authorized to update this budget item");
        return res.status(403).json({ message: "Not authorized to update this budget item" });
      }
      
      const budgetItemData = insertBudgetItemSchema.partial().parse(req.body);
      console.log("🔵 Parsed budget item data:", budgetItemData);
      
      const budgetItem = await storage.updateBudgetItem(budgetItemId, budgetItemData);
      
      if (!budgetItem) {
        console.log("🔴 Failed to update budget item");
        return res.status(500).json({ message: "Failed to update budget item" });
      }
      
      console.log("🟢 Budget item updated successfully:", budgetItem);
      res.json(budgetItem);
    } catch (error) {
      console.error("🔴 Error updating budget item:", error);
      if (error instanceof z.ZodError) {
        console.error("🔴 Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Invalid budget item data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete('/api/budget-items/:id', supabaseAuth, async (req, res) => {
    try {
      const budgetItemId = parseInt(req.params.id);
      const success = await storage.deleteBudgetItem(budgetItemId);
      
      if (!success) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.json({ message: "Budget item deleted successfully" });
    } catch (error) {
      console.error("Error deleting budget item:", error);
      res.status(500).json({ message: "Failed to delete budget item" });
    }
  });

  // Activity routes
  app.post('/api/trips/:tripId/activities', supabaseAuth, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      console.log("Received activity data:", req.body);
      console.log("Trip ID:", tripId);
      
      const activityData = insertActivitySchema.parse({ ...req.body, tripId });
      console.log("Parsed activity data:", activityData);
      
      const activity = await storage.createActivity(activityData);
      console.log("Created activity:", activity);
      
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Invalid activity data", 
          errors: error.errors 
        });
      } else {
      res.status(400).json({ message: "Invalid activity data" });
      }
    }
  });

  app.put('/api/activities/:id', supabaseAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const activityData = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(activityId, activityData);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(400).json({ message: "Invalid activity data" });
    }
  });

  app.delete('/api/activities/:id', supabaseAuth, async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const success = await storage.deleteActivity(activityId);
      
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Restaurant routes
  app.post('/api/trips/:tripId/restaurants', supabaseAuth, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const restaurantData = insertRestaurantSchema.parse({ ...req.body, tripId });
      const restaurant = await storage.createRestaurant(restaurantData);
      res.json(restaurant);
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(400).json({ message: "Invalid restaurant data" });
    }
  });

  app.put('/api/restaurants/:id', supabaseAuth, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const restaurantData = insertRestaurantSchema.partial().parse(req.body);
      const restaurant = await storage.updateRestaurant(restaurantId, restaurantData);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(400).json({ message: "Invalid restaurant data" });
    }
  });

  app.delete('/api/restaurants/:id', supabaseAuth, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const success = await storage.deleteRestaurant(restaurantId);
      
      if (!success) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  // Cost sharing receipt routes
  app.get('/api/trips/:tripId/cost-sharing-receipts', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.tripId);
      
      // Verify trip belongs to user
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const receipts = await storage.getCostSharingReceiptsByTripId(tripId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching cost sharing receipts:", error);
      res.status(500).json({ message: "Failed to fetch cost sharing receipts" });
    }
  });

  app.post('/api/trips/:tripId/cost-sharing-receipts', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.tripId);
      
      // Verify trip belongs to user
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const receiptData = insertCostSharingReceiptSchema.parse({ 
        ...req.body, 
        tripId 
      });
      
      const receipt = await storage.createCostSharingReceipt(receiptData);
      res.json(receipt);
    } catch (error) {
      console.error("Error creating cost sharing receipt:", error);
      res.status(400).json({ message: "Invalid receipt data" });
    }
  });

  app.put('/api/trips/:tripId/cost-sharing-receipts/:receiptId', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.tripId);
      const receiptId = parseInt(req.params.receiptId);
      
      // Verify trip belongs to user
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const receiptData = insertCostSharingReceiptSchema.partial().parse(req.body);
      const receipt = await storage.updateCostSharingReceipt(receiptId, receiptData, tripId);
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      res.json(receipt);
    } catch (error) {
      console.error("Error updating cost sharing receipt:", error);
      res.status(400).json({ message: "Invalid receipt data" });
    }
  });

  app.delete('/api/trips/:tripId/cost-sharing-receipts/:receiptId', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tripId = parseInt(req.params.tripId);
      const receiptId = parseInt(req.params.receiptId);
      
      // Verify trip belongs to user
      const trip = await storage.getTripById(tripId, userId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const success = await storage.deleteCostSharingReceipt(receiptId, tripId);
      
      if (!success) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      res.json({ message: "Receipt deleted successfully" });
    } catch (error) {
      console.error("Error deleting cost sharing receipt:", error);
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth test route
  app.get('/api/auth/test', supabaseAuth, async (req: any, res) => {
    res.json({ 
      message: 'Authenticated successfully', 
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  });

  // Debug route to check users without username
  app.get('/api/debug/users-without-username', async (req, res) => {
    try {
      const usersWithoutUsername = await db
        .select()
        .from(users)
        .where(sql`username IS NULL`);
      
      res.json({
        count: usersWithoutUsername.length,
        users: usersWithoutUsername.map(u => ({
          id: u.id,
          email: u.email,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
        }))
      });
    } catch (error) {
      console.error("Error fetching users without username:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Temporary debug route to delete current user and logout
  app.get('/api/debug/delete-current-user', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      
      console.log("🗑️ Debug: Deleting user:", userId, userEmail);
      
      // Delete user from database
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user from database" });
      }
      
      console.log("✅ User deleted from database:", userId);
      
      // Return HTML page that logs out and redirects
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Benutzer gelöscht</title>
          <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
        </head>
        <body>
          <h1>Benutzer wird gelöscht...</h1>
          <p>Benutzer ${userEmail} wurde aus der Datenbank gelöscht.</p>
          <p>Du wirst automatisch ausgeloggt und zur Startseite weitergeleitet...</p>
          
          <script>
            const { createClient } = supabase;
            const supabaseClient = createClient(
              '${process.env.SUPABASE_URL}',
              '${process.env.SUPABASE_ANON_KEY}'
            );
            
            // Logout and redirect
            supabaseClient.auth.signOut().then(() => {
              console.log('Logged out successfully');
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            }).catch(err => {
              console.error('Logout error:', err);
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in debug delete user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Flight search route (Simple Omio redirect)
  app.post('/api/trips/:tripId/search-flights', supabaseAuth, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const userId = req.user.id;

      console.log("🔵 Flight Search Request:");
      console.log("🔵 Trip ID:", tripId);
      console.log("🔵 User ID:", userId);

      // Verify trip belongs to user
      const trip = await storage.getTripById(tripId);
      if (!trip || trip.userId !== userId) {
        console.log("🔴 Trip not found or unauthorized");
        return res.status(404).json({ message: "Trip not found or unauthorized" });
      }

      // Check if trip has required data for flight search
      console.log("🔧 Trip data for flight search:", {
        departure: trip.departure,
        destination: trip.destination,
        startDate: trip.startDate,
        travelers: trip.travelers
      });
      
      if (!trip.departure || !trip.destination || !trip.startDate || !trip.travelers) {
        console.log("🔴 Missing required trip data for flight search");
        return res.status(400).json({ 
          message: "Fehlende Reisedaten. Bitte Abflughafen, Zielort, Reisedatum und Personenanzahl angeben." 
        });
      }

      // Check if there's a flight budget item
      const hasFlightBudget = trip.budgetItems?.some(item => 
        item.category === "Transport" && item.subcategory === "Flug"
      );

      if (!hasFlightBudget) {
        console.log("🔴 No flight budget item found");
        return res.status(400).json({ 
          message: "Kein Flug-Budgeteintrag gefunden. Bitte erstellen Sie zuerst einen Budgeteintrag für Flüge." 
        });
      }

      // Simple Omio redirect with affiliate ID
      const affiliateId = '5197603';
      const omioUrl = `https://www.omio.com/flights?partner=${affiliateId}`;
      
      console.log("🔵 Redirecting to Omio with affiliate ID:", omioUrl);

      return res.json({
        success: true,
        redirectUrl: omioUrl,
        message: "Weiterleitung zu Omio für Flugsuche",
        affiliateId: affiliateId,
        source: 'omio_redirect'
      });

    } catch (error: any) {
      console.error("🔴 Flight search error:", error);
      res.status(500).json({ 
        success: false,
        message: "Fehler beim Suchen von Flügen",
        error: error.message 
      });
    }
  });

  // Stripe Webhook Handler
  app.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

  // Stripe Subscription Routes
  app.get('/api/subscription/plans', (req, res) => {
    res.json(SUBSCRIPTION_PLANS);
  });

  app.get('/api/user/subscription', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getSubscription(userId);
      
      if (!subscription) {
        // Return default free subscription
        return res.json({
          status: 'free',
          billingInterval: 'monthly',
          tripsUsed: 0,
          tripsLimit: SUBSCRIPTION_PLANS.free.tripsLimit,
          canExport: SUBSCRIPTION_PLANS.free.canExport
        });
      }

      // Get trips count for this user
      const trips = await storage.getTripsByUserId(userId);
      const tripsUsed = trips.length;

      const plan = SUBSCRIPTION_PLANS[subscription.status];
      
      res.json({
        status: subscription.status,
        billingInterval: subscription.billingInterval || 'monthly',
        tripsUsed,
        tripsLimit: plan.tripsLimit,
        canExport: plan.canExport
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  app.post('/api/subscription/create-checkout', supabaseAuth, async (req: any, res) => {
    try {
      const { planId, billingInterval } = req.body;
      const userId = req.user.id;

      console.log('🟡 Creating checkout session:', { planId, billingInterval, userId });

      if (!planId || !billingInterval || planId === 'free') {
        return res.status(400).json({ message: 'Invalid plan or billing interval' });
      }

      // Get the price ID for this plan and interval
      const priceKey = `${planId}_${billingInterval}` as keyof typeof STRIPE_PRICE_IDS;
      const priceId = STRIPE_PRICE_IDS[priceKey];
      if (!priceId) {
        console.error('🔴 Price ID not found for:', planId, billingInterval, 'Key:', priceKey);
        return res.status(400).json({ message: 'Price ID not found for selected plan' });
      }

      console.log('🟡 Using Stripe Price ID:', priceId);

      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if not exists
      if (!customerId) {
        console.log('🔧 Creating new Stripe customer for user:', userId);
        const customerCreateParams: Stripe.CustomerCreateParams = {
          email: user.email || undefined,
          metadata: { userId },
        };
        const customer = await stripe.customers.create(customerCreateParams);
        customerId = customer.id;

        // Update user with Stripe customer ID
        await storage.updateUserStripeCustomerId(userId, customerId);
        console.log('✅ Created Stripe customer:', customerId);
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `https://d30aa00c-8763-4ca1-9417-b90045ee5959-00-2ci4nyryysra1.riker.replit.dev/pricing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `https://d30aa00c-8763-4ca1-9417-b90045ee5959-00-2ci4nyryysra1.riker.replit.dev/pricing?canceled=true`,
        client_reference_id: userId,
        metadata: {
          userId,
          planId,
          billingInterval,
        },
      });

      console.log('✅ Checkout session created:', session.id);
      res.json({ checkoutUrl: session.url });
    } catch (error: any) {
      console.error('🔴 Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
    }
  });

  app.post('/api/checkout/verify', supabaseAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      const userId = req.user.id;

      console.log('🟡 Verifying checkout session:', sessionId, 'for user:', userId);

      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required' });
      }

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      console.log('🟡 Retrieved session:', {
        id: session.id,
        payment_status: session.payment_status,
        client_reference_id: session.client_reference_id,
        metadata: session.metadata
      });

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment not completed' 
        });
      }

      if (session.client_reference_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Session does not belong to current user' 
        });
      }

      const planId = session.metadata?.planId;
      const billingInterval = session.metadata?.billingInterval;

      if (!planId || !billingInterval) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid session metadata' 
        });
      }

      // Update user subscription in database
      await storage.updateSubscription(userId, {
        status: planId as any,
        billingInterval: billingInterval as any,
        stripeSessionId: sessionId,
        stripeSubscriptionId: session.subscription as string
      });

      console.log('✅ Subscription updated for user:', userId, 'plan:', planId, 'interval:', billingInterval);

      res.json({
        success: true,
        plan: planId,
        billingInterval,
        message: 'Subscription activated successfully'
      });
    } catch (error: any) {
      console.error('🔴 Error verifying checkout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify checkout',
        error: error.message 
      });
    }
  });

  // Debug endpoint to check user's Stripe customer ID
  app.get('/api/debug/stripe-customer', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      res.json({
        userId,
        hasStripeCustomerId: !!user?.stripeCustomerId,
        stripeCustomerId: user?.stripeCustomerId,
        subscriptionStatus: user?.subscriptionStatus,
        billingInterval: user?.billingInterval
      });
    } catch (error) {
      console.error('🔴 Error checking Stripe customer:', error);
      res.status(500).json({ message: 'Failed to check Stripe customer' });
    }
  });

  // Stripe invoice endpoints
  app.get('/api/billing/invoices', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      console.log(`🔍 User ${userId} - stripeCustomerId: ${user?.stripeCustomerId || 'NONE'}`);
      
      if (!user || !user.stripeCustomerId) {
        console.log(`🔍 No Stripe customer ID found for user ${userId}`);
        return res.json({ invoices: [] });
      }

      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 50, // Get last 50 invoices
        status: 'paid', // Only show paid invoices
      });

      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.total / 100, // Convert from cents to euros
        currency: invoice.currency,
        status: invoice.status,
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        number: invoice.number,
        description: invoice.lines.data[0]?.description || 'Subscription',
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        period: {
          start: new Date(invoice.lines.data[0]?.period?.start * 1000 || 0).toISOString(),
          end: new Date(invoice.lines.data[0]?.period?.end * 1000 || 0).toISOString(),
        }
      }));

      console.log(`✅ Retrieved ${formattedInvoices.length} invoices for user ${userId}`);
      res.json({ invoices: formattedInvoices });
    } catch (error) {
      console.error('🔴 Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  // Get specific invoice details
  app.get('/api/billing/invoices/:invoiceId', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { invoiceId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Fetch the specific invoice from Stripe
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      // Verify that this invoice belongs to the user's customer
      if (invoice.customer !== user.stripeCustomerId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const formattedInvoice = {
        id: invoice.id,
        amount: invoice.total / 100,
        currency: invoice.currency,
        status: invoice.status,
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        number: invoice.number,
        description: invoice.lines.data[0]?.description || 'Subscription',
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        period: {
          start: new Date(invoice.lines.data[0]?.period?.start * 1000 || 0).toISOString(),
          end: new Date(invoice.lines.data[0]?.period?.end * 1000 || 0).toISOString(),
        },
        lines: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount / 100,
          currency: line.currency,
          period: {
            start: new Date(line.period?.start * 1000 || 0).toISOString(),
            end: new Date(line.period?.end * 1000 || 0).toISOString(),
          }
        }))
      };

      res.json({ invoice: formattedInvoice });
    } catch (error) {
      console.error('🔴 Error fetching invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // Get payment methods for a customer
  app.get('/api/billing/payment-methods', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      // Get customer to check default payment method
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      const defaultPaymentMethodId = typeof customer !== 'string' && !customer.deleted && customer.invoice_settings?.default_payment_method;

      const formattedPaymentMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
        isDefault: pm.id === defaultPaymentMethodId,
      }));

      res.json({ paymentMethods: formattedPaymentMethods });
    } catch (error) {
      console.error('🔴 Error fetching payment methods:', error);
      res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
  });

  // Create setup intent for adding new payment method
  app.post('/api/billing/setup-intent', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Create a Setup Intent
      const setupIntent = await stripe.setupIntents.create({
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      res.json({ 
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id 
      });
    } catch (error) {
      console.error('🔴 Error creating setup intent:', error);
      res.status(500).json({ message: 'Failed to create setup intent' });
    }
  });

  // Set default payment method
  app.post('/api/billing/set-default-payment-method', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { paymentMethodId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      if (!paymentMethodId) {
        return res.status(400).json({ message: 'Payment method ID is required' });
      }

      // Update customer's default payment method
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      res.json({ success: true, message: 'Standard-Zahlungsmethode erfolgreich geändert' });
    } catch (error) {
      console.error('🔴 Error setting default payment method:', error);
      res.status(500).json({ message: 'Failed to set default payment method' });
    }
  });

  // Delete payment method
  app.delete('/api/billing/payment-methods/:paymentMethodId', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { paymentMethodId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Detach payment method from customer
      await stripe.paymentMethods.detach(paymentMethodId);

      res.json({ success: true, message: 'Zahlungsmethode erfolgreich entfernt' });
    } catch (error) {
      console.error('🔴 Error deleting payment method:', error);
      res.status(500).json({ message: 'Failed to delete payment method' });
    }
  });

  // Create Stripe Customer Portal session
  app.post('/api/billing/portal', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if one doesn't exist
      if (!stripeCustomerId) {
        console.log(`🔧 Creating Stripe customer for user ${userId}`);
        const customerCreateParams2: Stripe.CustomerCreateParams = {
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          metadata: { userId },
        };
        const customer = await stripe.customers.create(customerCreateParams2);
        
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUserSubscription(
          userId,
          user.subscriptionStatus as any || 'free',
          user.subscriptionExpiresAt || undefined,
          stripeCustomerId,
          user.stripeSubscriptionId || undefined,
          user.billingInterval as any || 'monthly'
        );
        
        console.log(`✅ Created Stripe customer ${stripeCustomerId} for user ${userId}`);
      }

      // Create a Customer Portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/profile?tab=subscription`,
      });

      res.json({ url: portalSession.url });
    } catch (error: unknown) {
      console.error('🔴 Error creating billing portal session:', error);
      
      // Check for specific Stripe errors
      if ((error as any).message?.includes('No configuration provided')) {
        return res.status(400).json({ 
          message: 'Das Stripe Customer Portal muss zuerst im Stripe Dashboard konfiguriert werden. Gehe zu https://dashboard.stripe.com/settings/billing/portal und konfiguriere das Portal.' 
        });
      }
      
      res.status(500).json({ message: 'Failed to create billing portal session' });
    }
  });

  // Support route - only for Pro and Veteran users
  app.post('/api/support', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user's subscription status
      const subscriptionInfo = await storage.getUserSubscriptionStatus(userId);
      
      // Check if user is Pro or Veteran
      if (!subscriptionInfo || subscriptionInfo.status === 'free') {
        return res.status(403).json({ 
          message: "Support ist nur für Pro- und Veteran-Nutzer verfügbar" 
        });
      }

      const { subject, message, category } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ 
          message: "Betreff und Nachricht sind erforderlich" 
        });
      }

      // Get user info
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Nutzer nicht gefunden" });
      }

      // For now, we'll store the support request in console
      // You can later replace this with actual email sending using nodemailer
      console.log('📧 Support-Anfrage erhalten:');
      console.log(`Von: ${user.firstName} ${user.lastName} <${user.email}>`);
      console.log(`Abo: ${subscriptionInfo.status.toUpperCase()}`);
      console.log(`Kategorie: ${category || 'Allgemein'}`);
      console.log(`Betreff: ${subject}`);
      console.log(`Nachricht: ${message}`);
      console.log('---');

      // TODO: Implement actual email sending with nodemailer
      // const transporter = nodemailer.createTransporter({ ... });
      // await transporter.sendMail({ ... });

      res.json({ 
        success: true,
        message: "Deine Anfrage wurde erfolgreich gesendet. Wir melden uns in Kürze bei dir!" 
      });
      
    } catch (error) {
      console.error("🔴 Error processing support request:", error);
      res.status(500).json({ message: "Fehler beim Senden der Support-Anfrage" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
