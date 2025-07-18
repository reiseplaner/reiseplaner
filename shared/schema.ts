import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";



// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // For local auth
  username: varchar("username").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionStatus: varchar("subscription_status").default('free'), // 'free', 'pro', 'veteran'
  billingInterval: varchar("billing_interval").default('monthly'), // 'monthly', 'yearly'
  subscriptionExpiresAt: varchar("subscription_expires_at"), // ISO date string
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  departure: varchar("departure"), // IATA code
  destination: varchar("destination"), // IATA code
  startDate: date("start_date"),
  endDate: date("end_date"),
  travelers: integer("travelers").default(1),
  totalBudget: numeric("total_budget", { precision: 10, scale: 2 }),
  isPublic: boolean("is_public").default(false),
  publicSlug: varchar("public_slug").unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget items table
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  category: varchar("category").notNull(), // Transport, Unterkunft, Verpflegung, etc.
  subcategory: varchar("subcategory"),
  quantity: integer("quantity").default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  comment: text("comment"),
  affiliateLink: text("affiliate_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  category: varchar("category"), // Kategorie wie "Outdoor & Abenteuer", "Kultur & Sehenswürdigkeiten", etc.
  location: text("location"),
  date: date("date"),
  timeFrom: varchar("time_from"), // Format: "14:30"
  timeTo: varchar("time_to"), // Format: "16:30"
  price: numeric("price", { precision: 10, scale: 2 }),
  comment: text("comment"),
  bookingLink: text("booking_link"),
  status: varchar("status").default("geplant"), // geplant, gebucht
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  address: text("address"),
  date: date("date"),
  timeFrom: varchar("time_from"), // Format: "19:00"
  timeTo: varchar("time_to"), // Format: "21:00"
  cuisine: varchar("cuisine"),
  priceRange: varchar("price_range"), // €, €€, €€€
  reservationLink: text("reservation_link"),
  status: varchar("status").default("geplant"), // geplant, reserviert
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip upvotes table
export const tripUpvotes = pgTable("trip_upvotes", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip comments table
export const tripComments = pgTable("trip_comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost sharing receipts table
export const costSharingReceipts = pgTable("cost_sharing_receipts", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  itemType: varchar("item_type").notNull(), // 'budget', 'activity', 'restaurant'
  itemName: varchar("item_name").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  payer: varchar("payer").notNull(),
  persons: jsonb("persons").notNull(), // Array of PersonShare objects
  debts: jsonb("debts").notNull(), // Array of Debt objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
  tripUpvotes: many(tripUpvotes),
  tripComments: many(tripComments),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  budgetItems: many(budgetItems),
  activities: many(activities),
  restaurants: many(restaurants),
  costSharingReceipts: many(costSharingReceipts),
  upvotes: many(tripUpvotes),
  comments: many(tripComments),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  trip: one(trips, {
    fields: [budgetItems.tripId],
    references: [trips.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  trip: one(trips, {
    fields: [activities.tripId],
    references: [trips.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ one }) => ({
  trip: one(trips, {
    fields: [restaurants.tripId],
    references: [trips.id],
  }),
}));

export const tripUpvotesRelations = relations(tripUpvotes, ({ one }) => ({
  trip: one(trips, {
    fields: [tripUpvotes.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripUpvotes.userId],
    references: [users.id],
  }),
}));

export const tripCommentsRelations = relations(tripComments, ({ one }) => ({
  trip: one(trips, {
    fields: [tripComments.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripComments.userId],
    references: [users.id],
  }),
}));

export const costSharingReceiptsRelations = relations(costSharingReceipts, ({ one }) => ({
  trip: one(trips, {
    fields: [costSharingReceipts.tripId],
    references: [trips.id],
  }),
}));

// Insert schemas
export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertTripUpvoteSchema = createInsertSchema(tripUpvotes).omit({
  id: true,
  createdAt: true,
});

export const insertTripCommentSchema = createInsertSchema(tripComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostSharingReceiptSchema = createInsertSchema(costSharingReceipts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertTripUpvote = z.infer<typeof insertTripUpvoteSchema>;
export type TripUpvote = typeof tripUpvotes.$inferSelect;
export type InsertTripComment = z.infer<typeof insertTripCommentSchema>;
export type TripComment = typeof tripComments.$inferSelect;
export type InsertCostSharingReceipt = z.infer<typeof insertCostSharingReceiptSchema>;
export type CostSharingReceipt = typeof costSharingReceipts.$inferSelect;

// Trip with relations type
export type TripWithDetails = Trip & {
  budgetItems: BudgetItem[];
  activities: Activity[];
  restaurants: Restaurant[];
  costSharingReceipts?: CostSharingReceipt[];
};

// Public trip with community features
export type PublicTripWithDetails = TripWithDetails & {
  upvotes: TripUpvote[];
  comments: (TripComment & { user: User })[];
  upvoteCount: number;
  isUpvotedByUser?: boolean;
};

// Public trip with user info
export type PublicTripWithUser = Trip & {
  budgetItems: BudgetItem[];
  activities: Activity[];
  restaurants: Restaurant[];
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};
