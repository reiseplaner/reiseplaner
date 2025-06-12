import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAuth, supabase } from "./supabaseAuth";
import {
  insertTripSchema,
  insertBudgetItemSchema,
  insertActivitySchema,
  insertRestaurantSchema,
  users,
} from "@shared/schema";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { checkTripLimit, checkExportPermission } from './middleware/subscription';
import { SUBSCRIPTION_PLANS, STRIPE_PRICE_IDS } from './types/subscription';

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

      // Use Supabase to change password
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error("🔴 Supabase password change error:", error);
        return res.status(400).json({ 
          message: error.message || "Passwort konnte nicht geändert werden" 
        });
      }

      console.log(`✅ Password changed successfully for user ${userId}`);
      res.json({ message: "Passwort erfolgreich geändert" });
    } catch (error) {
      console.error("🔴 Error changing password:", error);
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

  // Stripe checkout session creation
  app.post('/api/subscription/create-checkout', supabaseAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planId } = req.body;
      
      if (!planId || !['pro', 'veteran'].includes(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      // For now, return a mock checkout URL
      // TODO: Implement actual Stripe integration
      const checkoutUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/pricing?plan=${planId}&success=mock`;
      
      res.json({ 
        checkoutUrl,
        mock: true,
        message: 'Mock checkout URL - real Stripe integration pending'
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}
