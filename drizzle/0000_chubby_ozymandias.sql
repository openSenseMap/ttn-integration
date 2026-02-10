CREATE TYPE "public"."ttn_profile" AS ENUM('json', 'debug', 'sensebox/home', 'lora-serialization', 'cayenne-lpp');--> statement-breakpoint
CREATE TABLE "ttn_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"dev_id" text NOT NULL,
	"app_id" text NOT NULL,
	"port" integer,
	"profile" "ttn_profile" DEFAULT 'json' NOT NULL,
	"decode_options" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ttn_integration_device_id_unique" UNIQUE("device_id")
);
