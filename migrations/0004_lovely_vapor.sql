CREATE TABLE "cost_sharing_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"item_type" varchar NOT NULL,
	"item_name" varchar NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payer" varchar NOT NULL,
	"persons" jsonb NOT NULL,
	"debts" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cost_sharing_receipts" ADD CONSTRAINT "cost_sharing_receipts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;