ALTER TABLE "ttn_integration" ADD CONSTRAINT "ttn_integration_port_range_check" CHECK ("port" IS NULL OR "port" BETWEEN 1 AND 223);--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
ALTER TABLE "ttn_integration"
ADD CONSTRAINT "ttn_integration_ttn_route_exclude"
EXCLUDE USING gist (
	"app_id" WITH =,
	"dev_id" WITH =,
	int4range(
		COALESCE("port", 1),
		COALESCE("port" + 1, 224),
		'[)'
	) WITH &&
);
