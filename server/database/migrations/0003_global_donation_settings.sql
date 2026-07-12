CREATE TYPE "public"."donation_verification_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'PAID', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."donation_payment_method_type" AS ENUM('BANK_TRANSFER', 'QRIS');--> statement-breakpoint
CREATE TABLE "site_donation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "donation_payment_method_type" NOT NULL,
	"provider_name" varchar(100),
	"account_name" varchar(150),
	"account_number" varchar(50),
	"qr_image_url" text,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donations" DROP CONSTRAINT "donations_family_id_families_id_fk";--> statement-breakpoint
ALTER TABLE "donations" DROP COLUMN "family_id";--> statement-breakpoint
ALTER TABLE "donations" DROP COLUMN "payment_provider";--> statement-breakpoint
ALTER TABLE "donations" DROP COLUMN "payment_reference";--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "donor_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "payment_method_id" uuid;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "transfer_sender_name" varchar(150);--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "transfer_note" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "proof_file_url" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "verified_by" text;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "status" TYPE "public"."donation_verification_status" USING (
	CASE
		WHEN "status"::text = 'FAILED' THEN 'REJECTED'::"public"."donation_verification_status"
		WHEN "status"::text = 'REFUNDED' THEN 'REJECTED'::"public"."donation_verification_status"
		ELSE "status"::text::"public"."donation_verification_status"
	END
);--> statement-breakpoint
ALTER TABLE "donations" RENAME COLUMN "status" TO "status_old";--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "status" "donation_verification_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
UPDATE "donations" SET "status" = (
	CASE
		WHEN "status_old"::text = 'FAILED' THEN 'REJECTED'::"public"."donation_verification_status"
		WHEN "status_old"::text = 'REFUNDED' THEN 'REJECTED'::"public"."donation_verification_status"
		ELSE "status_old"::text::"public"."donation_verification_status"
	END
);--> statement-breakpoint
ALTER TABLE "donations" DROP COLUMN "status_old";--> statement-breakpoint
DROP TYPE "public"."donation_status";--> statement-breakpoint
ALTER TABLE "site_donation_settings" ADD CONSTRAINT "site_donation_settings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_payment_method_id_site_donation_settings_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."site_donation_settings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_donation_settings_type_idx" ON "site_donation_settings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "site_donation_settings_is_active_idx" ON "site_donation_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "donations_user_id_idx" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donations_payment_method_id_idx" ON "donations" USING btree ("payment_method_id");--> statement-breakpoint
CREATE INDEX "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_created_at_idx" ON "donations" USING btree ("created_at");