import { relations } from "drizzle-orm/relations";
import { trips, budgetItems, restaurants, activities, users } from "./schema";

export const budgetItemsRelations = relations(budgetItems, ({one}) => ({
	trip: one(trips, {
		fields: [budgetItems.tripId],
		references: [trips.id]
	}),
}));

export const tripsRelations = relations(trips, ({one, many}) => ({
	budgetItems: many(budgetItems),
	restaurants: many(restaurants),
	activities: many(activities),
	user: one(users, {
		fields: [trips.userId],
		references: [users.id]
	}),
}));

export const restaurantsRelations = relations(restaurants, ({one}) => ({
	trip: one(trips, {
		fields: [restaurants.tripId],
		references: [trips.id]
	}),
}));

export const activitiesRelations = relations(activities, ({one}) => ({
	trip: one(trips, {
		fields: [activities.tripId],
		references: [trips.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	trips: many(trips),
}));