import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseAuth } from "./supabaseAuth";
import {
  insertTripSchema,
  insertBudgetItemSchema,
  insertActivitySchema,
  insertRestaurantSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', supabaseAuth, async (req: any, res) => {
    try {
      const supabaseUser = req.user;
      
      // Ensure user exists in our database
      await storage.upsertUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: supabaseUser.user_metadata?.avatar_url || null,
      });
      
      res.json(supabaseUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post('/api/trips', supabaseAuth, async (req: any, res) => {
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

  // Public trip routes
  app.get('/api/public/trips', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trips = await storage.getPublicTrips(limit);
      res.json(trips);
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

  const httpServer = createServer(app);
  return httpServer;
}
