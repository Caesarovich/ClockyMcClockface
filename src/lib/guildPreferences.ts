import type { Guild } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { type GuildPreferencesInsert, guildPreferences } from "../db/schema";

export async function createGuildPreferences(guild: Guild) {
	return db
		.insert(guildPreferences)
		.values({
			guildId: guild.id,
		})
		.onConflictDoNothing()
		.returning();
}

export async function getGuildPreferences(guild: Guild) {
	const prefs = await db
		.select()
		.from(guildPreferences)
		.where(eq(guildPreferences.guildId, guild.id));

	if (prefs.length === 0) {
		return (await createGuildPreferences(guild))[0];
	}

	return prefs[0];
}

export async function updateGuildPreferences(data: GuildPreferencesInsert) {
	return db
		.insert(guildPreferences)
		.values(data)
		.onConflictDoUpdate({
			target: guildPreferences.guildId,
			set: data,
		})
		.returning();
}
