import {
  users,
  trips,
  budgetItems,
  activities,
  restaurants,
  tripUpvotes,
  tripComments,
  type User,
  type UpsertUser,
  type Trip,
  type InsertTrip,
  type TripWithDetails,
  type PublicTripWithDetails,
  type PublicTripWithUser,
  type BudgetItem,
  type InsertBudgetItem,
  type Activity,
  type InsertActivity,
  type Restaurant,
  type InsertRestaurant,
  type TripUpvote,
  type InsertTripUpvote,
  type TripComment,
  type InsertTripComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { SUBSCRIPTION_LIMITS, type SubscriptionStatus, type SubscriptionInfo } from './types/subscription';

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  checkUsernameAvailability(username: string): Promise<boolean>;
  updateUserUsername(userId: string, username: string): Promise<User | undefined>;
  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Subscription operations
  getUserSubscriptionStatus(userId: string): Promise<SubscriptionInfo>;
  canCreateTrip(userId: string): Promise<{ allowed: boolean; reason?: string; currentPlan?: string }>;
  canExportTrip(userId: string): Promise<boolean>;
  updateUserSubscription(userId: string, subscriptionStatus: SubscriptionStatus, expiresAt?: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User | undefined>;
  
  // Trip operations
  getTripsByUserId(userId: string): Promise<Trip[]>;
  getTripById(id: number, userId?: string): Promise<TripWithDetails | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>, userId: string): Promise<Trip | undefined>;
  deleteTrip(id: number, userId: string): Promise<boolean>;
  
  // Public trip operations
  getPublicTrips(limit?: number): Promise<PublicTripWithUser[]>;
  getTripBySlug(slug: string): Promise<TripWithDetails | undefined>;
  getPublicTripWithCommunityFeatures(slug: string, userId?: string): Promise<PublicTripWithDetails | undefined>;
  
  // Community features
  upvoteTrip(tripId: number, userId: string): Promise<boolean>;
  removeUpvote(tripId: number, userId: string): Promise<boolean>;
  getTripUpvoteCount(tripId: number): Promise<number>;
  hasUserUpvoted(tripId: number, userId: string): Promise<boolean>;
  
  addTripComment(comment: InsertTripComment): Promise<TripComment>;
  getTripComments(tripId: number): Promise<(TripComment & { user: User })[]>;
  deleteTripComment(commentId: number, userId: string): Promise<boolean>;
  
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

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return !existingUser;
  }

  async updateUserUsername(userId: string, username: string): Promise<User | undefined> {
    try {
      console.log(`🔧 DatabaseStorage: Updating username for user ${userId} to ${username}`);
      
      const [updatedUser] = await db
        .update(users)
        .set({ 
          username,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log(`🔧 DatabaseStorage: Update result:`, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error(`🔴 DatabaseStorage: Error updating username for user ${userId}:`, error);
      throw error;
    }
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      console.log(`🔧 DatabaseStorage: Attempting to upsert user:`, userData);
      
      // Try to insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      
      console.log(`🔧 DatabaseStorage: User inserted successfully:`, user);
      return user;
    } catch (error: any) {
      console.log(`🔧 DatabaseStorage: Insert failed, handling conflict:`, error.code, error.detail);
      
      if (error.code === '23505') {
        // Handle both email and id conflicts
        if (error.detail?.includes('email')) {
          console.log(`🔧 DatabaseStorage: Email conflict detected, updating user with same email`);
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
          
          console.log(`🔧 DatabaseStorage: User updated by email:`, user);
          return user;
        } else {
          console.log(`🔧 DatabaseStorage: ID conflict detected, updating user with same ID`);
          // ID conflict - update existing user with same id
          // Only update fields that can be safely changed, not the ID itself
          const [user] = await db
            .update(users)
            .set({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              profileImageUrl: userData.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userData.id))
            .returning();
          
          console.log(`🔧 DatabaseStorage: User updated by ID:`, user);
          return user;
        }
      }
      
      console.error(`🔴 DatabaseStorage: Unexpected error in upsertUser:`, error);
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
  async getPublicTrips(limit: number = 10): Promise<PublicTripWithUser[]> {
    const publicTrips = await db
      .select({
        id: trips.id,
        name: trips.name,
        departure: trips.departure,
        destination: trips.destination,
        startDate: trips.startDate,
        endDate: trips.endDate,
        travelers: trips.travelers,
        totalBudget: trips.totalBudget,
        description: trips.description,
        isPublic: trips.isPublic,
        publicSlug: trips.publicSlug,
        userId: trips.userId,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(trips)
      .innerJoin(users, eq(trips.userId, users.id))
      .where(eq(trips.isPublic, true))
      .orderBy(desc(trips.createdAt))
      .limit(limit);

    // Add budget items, activities, and restaurants for each trip
    const tripsWithDetails = await Promise.all(
      publicTrips.map(async (trip) => {
        const [budgetItems, activities, restaurants] = await Promise.all([
          this.getBudgetItemsByTripId(trip.id),
          this.getActivitiesByTripId(trip.id),
          this.getRestaurantsByTripId(trip.id),
        ]);
        
        console.log(`🔍 Trip ${trip.name} (ID: ${trip.id}) has:`);
        console.log(`🔍 - ${budgetItems.length} budget items`);
        console.log(`🔍 - ${activities.length} activities`);
        console.log(`🔍 - ${restaurants.length} restaurants`);
        
        return { 
          ...trip, 
          budgetItems,
          activities,
          restaurants
        };
      })
    );

    console.log(`🔍 Returning ${tripsWithDetails.length} trips with full details`);
    return tripsWithDetails;
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

  async getPublicTripWithCommunityFeatures(slug: string, userId?: string): Promise<PublicTripWithDetails | undefined> {
    const trip = await this.getTripBySlug(slug);
    if (!trip) return undefined;

    const [upvoteCount, comments, isUpvotedByUser] = await Promise.all([
      this.getTripUpvoteCount(trip.id),
      this.getTripComments(trip.id),
      userId ? this.hasUserUpvoted(trip.id, userId) : Promise.resolve(false),
    ]);

    return {
      ...trip,
      upvotes: [],
      comments,
      upvoteCount,
      isUpvotedByUser,
    };
  }

  // Community features
  async upvoteTrip(tripId: number, userId: string): Promise<boolean> {
    try {
      await db.insert(tripUpvotes).values({ tripId, userId });
      return true;
    } catch (error: any) {
      // Handle duplicate upvote (user already upvoted)
      if (error.code === '23505') {
        return false;
      }
      throw error;
    }
  }

  async removeUpvote(tripId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(tripUpvotes)
      .where(and(eq(tripUpvotes.tripId, tripId), eq(tripUpvotes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getTripUpvoteCount(tripId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(tripUpvotes)
      .where(eq(tripUpvotes.tripId, tripId));
    return result.count;
  }

  async hasUserUpvoted(tripId: number, userId: string): Promise<boolean> {
    const [upvote] = await db
      .select()
      .from(tripUpvotes)
      .where(and(eq(tripUpvotes.tripId, tripId), eq(tripUpvotes.userId, userId)));
    return !!upvote;
  }

  async addTripComment(comment: InsertTripComment): Promise<TripComment> {
    const [newComment] = await db.insert(tripComments).values(comment).returning();
    return newComment;
  }

  async getTripComments(tripId: number): Promise<(TripComment & { user: User })[]> {
    const comments = await db
      .select({
        id: tripComments.id,
        tripId: tripComments.tripId,
        userId: tripComments.userId,
        content: tripComments.content,
        createdAt: tripComments.createdAt,
        updatedAt: tripComments.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tripComments)
      .innerJoin(users, eq(tripComments.userId, users.id))
      .where(eq(tripComments.tripId, tripId))
      .orderBy(desc(tripComments.createdAt));

    return comments;
  }

  async deleteTripComment(commentId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(tripComments)
      .where(and(eq(tripComments.id, commentId), eq(tripComments.userId, userId)));
    return (result.rowCount ?? 0) > 0;
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

  async deleteUser(userId: string): Promise<boolean> {
    try {
      console.log("🗑️ Starting user deletion process for:", userId);
      
      // Get all trips by this user to delete their related data
      const userTrips = await db
        .select({ id: trips.id })
        .from(trips)
        .where(eq(trips.userId, userId));
      
      console.log("🗑️ Found trips to delete:", userTrips.length);
      
      // Delete all related data for each trip
      for (const trip of userTrips) {
        console.log("🗑️ Deleting data for trip:", trip.id);
        
        // Delete budget items, activities, restaurants for this trip
        await Promise.all([
          db.delete(budgetItems).where(eq(budgetItems.tripId, trip.id)),
          db.delete(activities).where(eq(activities.tripId, trip.id)),
          db.delete(restaurants).where(eq(restaurants.tripId, trip.id)),
          db.delete(tripUpvotes).where(eq(tripUpvotes.tripId, trip.id)),
          db.delete(tripComments).where(eq(tripComments.tripId, trip.id)),
        ]);
      }
      
      // Delete all trips by this user
      await db.delete(trips).where(eq(trips.userId, userId));
      console.log("🗑️ Deleted all trips for user");
      
      // Delete all upvotes by this user (on other people's trips)
      await db.delete(tripUpvotes).where(eq(tripUpvotes.userId, userId));
      console.log("🗑️ Deleted all upvotes by user");
      
      // Delete all comments by this user (on other people's trips)
      await db.delete(tripComments).where(eq(tripComments.userId, userId));
      console.log("🗑️ Deleted all comments by user");
      
      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, userId));
      console.log("🗑️ Deleted user, affected rows:", result.rowCount);
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("🔴 Error deleting user:", error);
      throw error;
    }
  }

  // Subscription operations
  async getUserSubscriptionStatus(userId: string): Promise<SubscriptionInfo> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userTrips = await this.getTripsByUserId(userId);
    const subscriptionStatus: SubscriptionStatus = (user.subscriptionStatus as SubscriptionStatus) || 'free';
    const limits = SUBSCRIPTION_LIMITS[subscriptionStatus];

    // Check if subscription is expired
    const now = new Date();
    const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now;
    const effectiveStatus: SubscriptionStatus = isExpired ? 'free' : subscriptionStatus;
    const effectiveLimits = SUBSCRIPTION_LIMITS[effectiveStatus];

    return {
      status: effectiveStatus,
      expiresAt: user.subscriptionExpiresAt,
      tripsUsed: userTrips.length,
      tripsLimit: effectiveLimits.tripsLimit,
      canExport: effectiveLimits.canExport,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
  }

  async canCreateTrip(userId: string): Promise<{ allowed: boolean; reason?: string; currentPlan?: string }> {
    const subscriptionInfo = await this.getUserSubscriptionStatus(userId);
    
    if (subscriptionInfo.tripsUsed >= subscriptionInfo.tripsLimit) {
      return {
        allowed: false,
        reason: `Sie haben das Limit von ${subscriptionInfo.tripsLimit} Reisen für den ${subscriptionInfo.status.toUpperCase()} Plan erreicht.`,
        currentPlan: subscriptionInfo.status,
      };
    }

    return { allowed: true };
  }

  async canExportTrip(userId: string): Promise<boolean> {
    const subscriptionInfo = await this.getUserSubscriptionStatus(userId);
    return subscriptionInfo.canExport;
  }

  async updateUserSubscription(userId: string, subscriptionStatus: SubscriptionStatus, expiresAt?: string, stripeCustomerId?: string, stripeSubscriptionId?: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionStatus,
        subscriptionExpiresAt: expiresAt,
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
