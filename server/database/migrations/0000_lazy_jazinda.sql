CREATE TYPE "public"."date_precision" AS ENUM('FULL', 'YEAR_MONTH', 'YEAR', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."family_role" AS ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."invitation_role" AS ENUM('EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."marriage_status" AS ENUM('MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('PHOTO', 'DOCUMENT', 'VIDEO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."member_relation" AS ENUM('BIOLOGICAL', 'ADOPTED', 'STEP', 'FOSTER', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."parent_role" AS ENUM('FATHER', 'MOTHER', 'PARENT', 'GUARDIAN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('PRIVATE', 'INVITE_ONLY', 'PUBLIC');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"family_id" uuid,
	"action" varchar(100) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(255),
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"family_id" uuid,
	"donor_name" varchar(150),
	"donor_email" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'IDR' NOT NULL,
	"payment_provider" varchar(50),
	"payment_reference" varchar(150),
	"status" "donation_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"visibility" "visibility" DEFAULT 'PRIVATE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"nickname" varchar(100),
	"gender" "gender" DEFAULT 'UNKNOWN' NOT NULL,
	"birth_place" varchar(100),
	"birth_date" date,
	"birth_date_precision" date_precision DEFAULT 'UNKNOWN' NOT NULL,
	"is_alive" boolean DEFAULT true NOT NULL,
	"death_date" date,
	"death_place" varchar(100),
	"death_date_precision" date_precision DEFAULT 'UNKNOWN' NOT NULL,
	"occupation" varchar(100),
	"education" varchar(100),
	"religion" varchar(50),
	"phone" varchar(30),
	"email" varchar(150),
	"address" text,
	"bio" text,
	"notes_private" text,
	"photo_url" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "family_user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "family_role" DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_user_roles_family_user_unique" UNIQUE("family_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"role" "invitation_role" DEFAULT 'VIEWER' NOT NULL,
	"invited_by" text NOT NULL,
	"expired_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marriages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"partner_1_id" uuid NOT NULL,
	"partner_2_id" uuid NOT NULL,
	"marriage_date" date,
	"marriage_place" varchar(100),
	"status" "marriage_status" DEFAULT 'UNKNOWN' NOT NULL,
	"ended_at" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marriages_partners_not_same_check" CHECK ("marriages"."partner_1_id" <> "marriages"."partner_2_id")
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"family_member_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"media_type" "media_type" DEFAULT 'OTHER' NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_child_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"relation_type" "member_relation" DEFAULT 'BIOLOGICAL' NOT NULL,
	"parent_role" "parent_role" DEFAULT 'PARENT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_child_relation_unique" UNIQUE("parent_id","child_id","relation_type"),
	CONSTRAINT "parent_child_not_same_check" CHECK ("parent_child_relations"."parent_id" <> "parent_child_relations"."child_id")
);
--> statement-breakpoint
CREATE TABLE "privacy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"show_living_people" boolean DEFAULT false NOT NULL,
	"show_birth_date" boolean DEFAULT false NOT NULL,
	"show_death_date" boolean DEFAULT true NOT NULL,
	"show_contact" boolean DEFAULT false NOT NULL,
	"allow_export" boolean DEFAULT false NOT NULL,
	"allow_guest_view" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_user_roles" ADD CONSTRAINT "family_user_roles_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_user_roles" ADD CONSTRAINT "family_user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_partner_1_id_family_members_id_fk" FOREIGN KEY ("partner_1_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_partner_2_id_family_members_id_fk" FOREIGN KEY ("partner_2_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relations" ADD CONSTRAINT "parent_child_relations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relations" ADD CONSTRAINT "parent_child_relations_parent_id_family_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relations" ADD CONSTRAINT "parent_child_relations_child_id_family_members_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_settings" ADD CONSTRAINT "privacy_settings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "families_slug_idx" ON "families" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "families_owner_user_id_idx" ON "families" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "families_visibility_idx" ON "families" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "family_members_family_id_idx" ON "family_members" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_members_full_name_idx" ON "family_members" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "family_members_is_alive_idx" ON "family_members" USING btree ("is_alive");--> statement-breakpoint
CREATE INDEX "family_members_birth_date_idx" ON "family_members" USING btree ("birth_date");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_family_id_idx" ON "invitations" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "marriages_family_id_idx" ON "marriages" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "marriages_partner_1_id_idx" ON "marriages" USING btree ("partner_1_id");--> statement-breakpoint
CREATE INDEX "marriages_partner_2_id_idx" ON "marriages" USING btree ("partner_2_id");--> statement-breakpoint
CREATE INDEX "media_files_family_id_idx" ON "media_files" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "media_files_family_member_id_idx" ON "media_files" USING btree ("family_member_id");--> statement-breakpoint
CREATE INDEX "media_files_uploaded_by_idx" ON "media_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "parent_child_relations_family_id_idx" ON "parent_child_relations" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "parent_child_relations_parent_id_idx" ON "parent_child_relations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "parent_child_relations_child_id_idx" ON "parent_child_relations" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "privacy_settings_family_id_idx" ON "privacy_settings" USING btree ("family_id");