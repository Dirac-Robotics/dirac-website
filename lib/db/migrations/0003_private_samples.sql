CREATE TYPE "public"."sample_status" AS ENUM('new', 'reviewing', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."sample_upload_state" AS ENUM('uploading', 'complete', 'delete_failed');--> statement-breakpoint
CREATE TABLE "sample_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"relative_path" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"staging_key" text NOT NULL,
	"storage_key" text NOT NULL,
	"uploaded_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sample_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "sample_status" DEFAULT 'new' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"upload_state" "sample_upload_state" DEFAULT 'uploading' NOT NULL,
	"upload_token_hash" text,
	"upload_expires_at" timestamp with time zone,
	"last_error" text,
	CONSTRAINT "sample_category_check" CHECK ("sample_requests"."category" IN ('scene_videos', 'teleoperation'))
);
--> statement-breakpoint
ALTER TABLE "sample_attachments" ADD CONSTRAINT "sample_attachments_request_id_sample_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."sample_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sample_attachments_request_idx" ON "sample_attachments" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sample_attachments_storage_unique" ON "sample_attachments" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "sample_attachments_staging_unique" ON "sample_attachments" USING btree ("staging_key");--> statement-breakpoint
CREATE INDEX "sample_requests_created_idx" ON "sample_requests" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sample_requests_status_idx" ON "sample_requests" USING btree ("status");