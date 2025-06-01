-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"category" varchar NOT NULL,
	"subcategory" varchar,
	"quantity" integer DEFAULT 1,
	"unit_price" numeric(10, 2),
	"total_price" numeric(10, 2),
	"comment" text,
	"affiliate_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"address" text,
	"date" date,
	"cuisine" varchar,
	"price_range" varchar,
	"reservation_link" text,
	"status" varchar DEFAULT 'geplant',
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"time_from" varchar,
	"time_to" varchar
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"location" text,
	"date" date,
	"price" numeric(10, 2),
	"comment" text,
	"booking_link" text,
	"status" varchar DEFAULT 'geplant',
	"created_at" timestamp DEFAULT now(),
	"time_from" varchar,
	"time_to" varchar,
	"category" varchar
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"departure" varchar,
	"destination" varchar,
	"start_date" date,
	"end_date" date,
	"travelers" integer DEFAULT 1,
	"total_budget" numeric(10, 2),
	"is_public" boolean DEFAULT false,
	"public_slug" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "trips_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
*/