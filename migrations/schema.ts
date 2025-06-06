import { pgTable, foreignKey, serial, integer, varchar, numeric, text, timestamp, date, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const budgetItems = pgTable("budget_items", {
	id: serial().primaryKey().notNull(),
	tripId: integer("trip_id").notNull(),
	category: varchar().notNull(),
	subcategory: varchar(),
	quantity: integer().default(1),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }),
	comment: text(),
	affiliateLink: text("affiliate_link"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "budget_items_trip_id_trips_id_fk"
		}).onDelete("cascade"),
]);

export const restaurants = pgTable("restaurants", {
	id: serial().primaryKey().notNull(),
	tripId: integer("trip_id").notNull(),
	name: varchar().notNull(),
	address: text(),
	date: date(),
	cuisine: varchar(),
	priceRange: varchar("price_range"),
	reservationLink: text("reservation_link"),
	status: varchar().default('geplant'),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	timeFrom: varchar("time_from"),
	timeTo: varchar("time_to"),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "restaurants_trip_id_trips_id_fk"
		}).onDelete("cascade"),
]);

export const activities = pgTable("activities", {
	id: serial().primaryKey().notNull(),
	tripId: integer("trip_id").notNull(),
	title: varchar().notNull(),
	location: text(),
	date: date(),
	price: numeric({ precision: 10, scale:  2 }),
	comment: text(),
	bookingLink: text("booking_link"),
	status: varchar().default('geplant'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	timeFrom: varchar("time_from"),
	timeTo: varchar("time_to"),
	category: varchar(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "activities_trip_id_trips_id_fk"
		}).onDelete("cascade"),
]);

export const trips = pgTable("trips", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	name: varchar().notNull(),
	departure: varchar(),
	destination: varchar(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	travelers: integer().default(1),
	totalBudget: numeric("total_budget", { precision: 10, scale:  2 }),
	isPublic: boolean("is_public").default(false),
	publicSlug: varchar("public_slug"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "trips_user_id_users_id_fk"
		}),
	unique("trips_public_slug_unique").on(table.publicSlug),
]);

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar(),
	username: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	
	// Subscription fields for pricing system
	subscriptionStatus: varchar("subscription_status").default('free'), // 'free', 'pro', 'veteran'
	subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: 'string' }),
	stripeCustomerId: varchar("stripe_customer_id"),
	stripeSubscriptionId: varchar("stripe_subscription_id"),
	
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
