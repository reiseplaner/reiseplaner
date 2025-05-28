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
      const user = req.user;
      res.json(user);
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
      const trip = await storage.getTripById(tripId, userId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip:", error);
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
      const tripData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(tripId, tripData, userId);
      
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
      const budgetItemData = insertBudgetItemSchema.parse({ ...req.body, tripId });
      const budgetItem = await storage.createBudgetItem(budgetItemData);
      res.json(budgetItem);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: "Invalid budget item data" });
    }
  });

  app.put('/api/budget-items/:id', supabaseAuth, async (req, res) => {
    try {
      const budgetItemId = parseInt(req.params.id);
      const budgetItemData = insertBudgetItemSchema.partial().parse(req.body);
      const budgetItem = await storage.updateBudgetItem(budgetItemId, budgetItemData);
      
      if (!budgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      res.json(budgetItem);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(400).json({ message: "Invalid budget item data" });
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
      const activityData = insertActivitySchema.parse({ ...req.body, tripId });
      const activity = await storage.createActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: "Invalid activity data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
