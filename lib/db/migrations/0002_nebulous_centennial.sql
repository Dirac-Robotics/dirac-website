CREATE TABLE "asset_pack_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"company" text,
	"bundle_id" text NOT NULL,
	"terms_version" text NOT NULL,
	"terms_accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"marketing_consent_at" timestamp with time zone,
	"retention_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_pack_downloads_bundle_check" CHECK ("asset_pack_downloads"."bundle_id" IN ('purple-chair', 'table', 'hammer-v2', 'all-assets'))
);
--> statement-breakpoint
CREATE TABLE "asset_pack_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"session_id" uuid NOT NULL,
	"path" text NOT NULL,
	"asset_slug" text,
	"bundle_id" text,
	"experiment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_pack_events_event_check" CHECK ("asset_pack_events"."event" IN ('viewer_open', 'proof_play', 'proof_scrub', 'download_gate_open', 'download_unlocked', 'experiment_select'))
);
--> statement-breakpoint
CREATE INDEX "asset_pack_downloads_created_idx" ON "asset_pack_downloads" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "asset_pack_downloads_email_idx" ON "asset_pack_downloads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "asset_pack_downloads_bundle_idx" ON "asset_pack_downloads" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "asset_pack_downloads_retention_idx" ON "asset_pack_downloads" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "asset_pack_events_created_idx" ON "asset_pack_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "asset_pack_events_event_idx" ON "asset_pack_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "asset_pack_events_session_idx" ON "asset_pack_events" USING btree ("session_id");