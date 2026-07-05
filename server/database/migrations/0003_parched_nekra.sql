CREATE TYPE "public"."node_view_mode" AS ENUM('CLASSIC_CARD', 'COMPACT_MINIMAL', 'DETAILED_PROFILE', 'MEMORIAL_STYLE');--> statement-breakpoint
CREATE TABLE "family_tree_node_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"member_id" uuid NOT NULL,
	"node_view_mode" "node_view_mode",
	"show_photos" boolean,
	"show_birth_dates" boolean,
	"show_nicknames" boolean,
	"color_by_gender" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_tree_node_preferences_family_user_member_unique" UNIQUE("family_id","user_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "family_tree_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"node_view_mode" "node_view_mode" DEFAULT 'CLASSIC_CARD' NOT NULL,
	"show_photos" boolean DEFAULT true NOT NULL,
	"show_birth_dates" boolean DEFAULT true NOT NULL,
	"show_nicknames" boolean DEFAULT true NOT NULL,
	"color_by_gender" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_tree_preferences_family_user_unique" UNIQUE("family_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "family_tree_node_preferences" ADD CONSTRAINT "family_tree_node_preferences_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_tree_node_preferences" ADD CONSTRAINT "family_tree_node_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_tree_node_preferences" ADD CONSTRAINT "family_tree_node_preferences_member_id_family_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_tree_preferences" ADD CONSTRAINT "family_tree_preferences_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_tree_preferences" ADD CONSTRAINT "family_tree_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_tree_node_preferences_family_id_idx" ON "family_tree_node_preferences" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_tree_node_preferences_user_id_idx" ON "family_tree_node_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "family_tree_node_preferences_member_id_idx" ON "family_tree_node_preferences" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "family_tree_preferences_family_id_idx" ON "family_tree_preferences" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_tree_preferences_user_id_idx" ON "family_tree_preferences" USING btree ("user_id");