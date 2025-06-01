import {
  users,
  trips,
  budgetItems,
  activities,
  restaurants,
  type User,
  type UpsertUser,
  type Trip,
  type InsertTrip,
  type TripWithDetails,
  type BudgetItem,
  type InsertBudgetItem,
  type Activity,
  type InsertActivity,
  type Restaurant,
  type InsertRestaurant,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trip operations
  getTripsByUserId(userId: string): Promise<Trip[]>;
  getTripById(id: number, userId?: string): Promise<TripWithDetails | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>, userId: string): Promise<Trip | undefined>;
  deleteTrip(id: number, userId: string): Promise<boolean>;
  
  // Public trip operations
  getPublicTrips(limit?: number): Promise<Trip[]>;
  getTripBySlug(slug: string): Promise<TripWithDetails | undefined>;
  
  // Budget operations
  getBudgetItemsByTripId(tripId: number): Promise<BudgetItem[]>;
  getBudgetItemById(id: number): Promise<BudgetItem | undefined>;
  createBudgetItem(budgetItem: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, budgetItem: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  deleteBudgetItem(id: number): Promise<boolean>;
  
  // Activity operations
  getActivitiesByTripId(tripId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Restaurant operations
  getRestaurantsByTripId(tripId: number): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error: any) {
      if (error.code === '23505') {
        // Handle both email and id conflicts
        if (error.detail?.includes('email')) {
          // Email conflict - update existing user with same email
          const [user] = await db
            .update(users)
            .set({
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              profileImageUrl: userData.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.email, userData.email!))
            .returning();
          return user;
        } else {
          // ID conflict - update existing user with same id
          const [user] = await db
            .update(users)
            .set({
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userData.id))
            .returning();
          return user;
        }
      }
      throw error;
    }
  }

  // Trip operations
  async getTripsByUserId(userId: string): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.updatedAt));
  }

  async getTripById(id: number, userId?: string): Promise<TripWithDetails | undefined> {
    const whereConditions = [eq(trips.id, id)];
    
    if (userId) {
      whereConditions.push(eq(trips.userId, userId));
    }
    
    const [trip] = await db
      .select()
      .from(trips)
      .where(and(...whereConditions));
    if (!trip) return undefined;

    const [tripBudgetItems, tripActivities, tripRestaurants] = await Promise.all([
      this.getBudgetItemsByTripId(id),
      this.getActivitiesByTripId(id),
      this.getRestaurantsByTripId(id),
    ]);

    return {
      ...trip,
      budgetItems: tripBudgetItems,
      activities: tripActivities,
      restaurants: tripRestaurants,
    };
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>, userId: string): Promise<Trip | undefined> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...trip, updatedAt: new Date() })
      .where(and(eq(trips.id, id), eq(trips.userId, userId)))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Public trip operations
  async getPublicTrips(limit = 10): Promise<Trip[]> {
    return await db
      .select()
      .from(trips)
      .where(eq(trips.isPublic, true))
      .orderBy(desc(trips.updatedAt))
      .limit(limit);
  }

  async getTripBySlug(slug: string): Promise<TripWithDetails | undefined> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.publicSlug, slug), eq(trips.isPublic, true)));
    
    if (!trip) return undefined;

    const [tripBudgetItems, tripActivities, tripRestaurants] = await Promise.all([
      this.getBudgetItemsByTripId(trip.id),
      this.getActivitiesByTripId(trip.id),
      this.getRestaurantsByTripId(trip.id),
    ]);

    return {
      ...trip,
      budgetItems: tripBudgetItems,
      activities: tripActivities,
      restaurants: tripRestaurants,
    };
  }

  // Budget operations
  async getBudgetItemsByTripId(tripId: number): Promise<BudgetItem[]> {
    console.log("🔍 getBudgetItemsByTripId called with tripId:", tripId);
    
    const items = await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.tripId, tripId))
      .orderBy(desc(budgetItems.createdAt));
    
    console.log("🔍 Budget items found:", items.length);
    console.log("🔍 Budget items:", items);
    
    return items;
  }

  async getBudgetItemById(id: number): Promise<BudgetItem | undefined> {
    const [budgetItem] = await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.id, id));
    return budgetItem;
  }

  async createBudgetItem(budgetItem: InsertBudgetItem): Promise<BudgetItem> {
    console.log("🔍 createBudgetItem called with data:", budgetItem);
    
    const [newBudgetItem] = await db.insert(budgetItems).values(budgetItem).returning();
    
    console.log("🔍 Budget item created in database:", newBudgetItem);
    
    return newBudgetItem;
  }

  async updateBudgetItem(id: number, budgetItem: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const [updatedBudgetItem] = await db
      .update(budgetItems)
      .set(budgetItem)
      .where(eq(budgetItems.id, id))
      .returning();
    return updatedBudgetItem;
  }

  async deleteBudgetItem(id: number): Promise<boolean> {
    const result = await db.delete(budgetItems).where(eq(budgetItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activity operations
  async getActivitiesByTripId(tripId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.tripId, tripId))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updatedActivity] = await db
      .update(activities)
      .set(activity)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Restaurant operations
  async getRestaurantsByTripId(tripId: number): Promise<Restaurant[]> {
    return await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.tripId, tripId))
      .orderBy(desc(restaurants.createdAt));
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db.insert(restaurants).values(restaurant).returning();
    return newRestaurant;
  }

  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set(restaurant)
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    const result = await db.delete(restaurants).where(eq(restaurants.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
