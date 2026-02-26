CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invitation_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`max_uses` integer DEFAULT 50 NOT NULL,
	`current_uses` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_codes_code_unique` ON `invitation_codes` (`code`);--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`race_id` text NOT NULL,
	`position_1_rider_id` text NOT NULL,
	`position_2_rider_id` text NOT NULL,
	`position_3_rider_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`position_1_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_2_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_3_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `race_results` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`position_1_rider_id` text NOT NULL,
	`position_2_rider_id` text NOT NULL,
	`position_3_rider_id` text NOT NULL,
	`confirmed_at` integer NOT NULL,
	`confirmed_by` text,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`position_1_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_2_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_3_rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `race_results_race_id_unique` ON `race_results` (`race_id`);--> statement-breakpoint
CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`round` integer NOT NULL,
	`name` text NOT NULL,
	`name_it` text NOT NULL,
	`circuit` text NOT NULL,
	`circuit_it` text NOT NULL,
	`country` text NOT NULL,
	`country_it` text NOT NULL,
	`country_code` text NOT NULL,
	`date` text NOT NULL,
	`season` integer DEFAULT 2026 NOT NULL,
	`track_image` text,
	`official_results_url` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`new_date` text,
	`is_result_confirmed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `riders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`team_id` text NOT NULL,
	`nationality` text NOT NULL,
	`is_wildcard` integer DEFAULT false NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`season` integer DEFAULT 2026 NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`race_id` text NOT NULL,
	`points` real DEFAULT 0 NOT NULL,
	`position_1_points` real DEFAULT 0 NOT NULL,
	`position_2_points` real DEFAULT 0 NOT NULL,
	`position_3_points` real DEFAULT 0 NOT NULL,
	`calculated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`manufacturer` text NOT NULL,
	`color` text NOT NULL,
	`season` integer DEFAULT 2026 NOT NULL,
	`is_factory` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`password_hash` text,
	`nickname` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_nickname_unique` ON `users` (`nickname`);--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
