CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`publish_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_announcements_publish_active` ON `announcements` (`is_active`,`publish_at`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`shop_id` text,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`checkpoint_code` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_challenges_checkpoint_code` ON `challenges` (`checkpoint_code`);--> statement-breakpoint
CREATE INDEX `idx_challenges_event_active_order` ON `challenges` (`event_id`,`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`points` integer NOT NULL,
	`checked_in_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_member_challenge` ON `checkins` (`member_id`,`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_checkins_member_date` ON `checkins` (`member_id`,`checked_in_at`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`hero_image` text,
	`rules` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_status_dates` ON `events` (`status`,`start_at`,`end_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_code` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`pin_hash` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_member_code` ON `members` (`member_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_phone` ON `members` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_members_status` ON `members` (`status`);--> statement-breakpoint
CREATE TABLE `point_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_point_transactions_member_date` ON `point_transactions` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `prizes` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`points_cost` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`image_url` text,
	`redemption_note` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_prizes_event_active` ON `prizes` (`event_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`prize_id` text NOT NULL,
	`points_cost` integer NOT NULL,
	`claim_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` text NOT NULL,
	`verified_at` text,
	`verified_by` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prize_id`) REFERENCES `prizes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_redemptions_claim_code` ON `redemptions` (`claim_code`);--> statement-breakpoint
CREATE INDEX `idx_redemptions_status_date` ON `redemptions` (`status`,`requested_at`);--> statement-breakpoint
CREATE INDEX `idx_redemptions_member_date` ON `redemptions` (`member_id`,`requested_at`);--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`address` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`latitude` text,
	`longitude` text,
	`open_hours` text DEFAULT '' NOT NULL,
	`bonus_points` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_shops_event_active` ON `shops` (`event_id`,`is_active`);
--> statement-breakpoint
PRAGMA optimize;
