ALTER TABLE "asset_media" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "asset_request_media" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "asset_requests" ADD COLUMN "organization" text;