CREATE TABLE `emotion_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`calculated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`result_json` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `environment_inputs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`age_range` text NOT NULL,
	`family_affection` integer NOT NULL,
	`family_stability` integer NOT NULL,
	`family_control` integer NOT NULL,
	`school_belonging` integer NOT NULL,
	`school_stress` integer NOT NULL,
	`school_social_success` integer NOT NULL,
	`events_stress_count` integer NOT NULL,
	`events_success_count` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `environment_inputs_session_age_unique` ON `environment_inputs` (`session_id`,`age_range`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
