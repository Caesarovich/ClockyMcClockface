CREATE TABLE `guild_preferences` (
	`guildId` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`mode` text DEFAULT 'dynamic' NOT NULL,
	`staticChannelId` text,
	`timezone` text DEFAULT 'UTC' NOT NULL
);
