import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guildPreferences = sqliteTable("guild_preferences", {
	guildId: text().notNull().primaryKey(),
	enabled: integer({ mode: "boolean" }).notNull().default(true),
	mode: text({ enum: ["dynamic", "static"] })
		.notNull()
		.default("dynamic"),
	staticChannelId: text(),
	timezone: text().notNull().default("UTC"),
});

export type GuildPreferences = typeof guildPreferences.$inferSelect;
export type GuildPreferencesInsert = typeof guildPreferences.$inferInsert;
