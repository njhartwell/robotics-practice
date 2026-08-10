CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_slug` text NOT NULL,
	`part` text NOT NULL,
	`step_id` text,
	`kind` text NOT NULL,
	`rating` integer,
	`comment` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feedback_user_id_idx` ON `feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `feedback_lesson_slug_idx` ON `feedback` (`lesson_slug`);--> statement-breakpoint
CREATE INDEX `feedback_status_idx` ON `feedback` (`status`);--> statement-breakpoint
CREATE INDEX `feedback_created_at_idx` ON `feedback` (`created_at`);