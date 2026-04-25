CREATE TABLE "emotion_results" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result_json" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environment_inputs" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"age_range" text NOT NULL,
	"family_affection" integer NOT NULL,
	"family_stability" integer NOT NULL,
	"family_control" integer NOT NULL,
	"school_belonging" integer NOT NULL,
	"school_stress" integer NOT NULL,
	"school_social_success" integer NOT NULL,
	"events_stress_count" integer NOT NULL,
	"events_success_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"action_text" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'saved' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emotion_results" ADD CONSTRAINT "emotion_results_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environment_inputs" ADD CONSTRAINT "environment_inputs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_actions" ADD CONSTRAINT "saved_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_actions" ADD CONSTRAINT "saved_actions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "environment_inputs_session_age_unique" ON "environment_inputs" USING btree ("session_id","age_range");