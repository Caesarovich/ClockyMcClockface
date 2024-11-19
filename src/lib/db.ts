import { Database } from "bun:sqlite";

export const db = new Database("db.sqlite", { create: true, strict: true });

db.exec(
	"CREATE TABLE IF NOT EXISTS guilds_configuration (guild_id TEXT PRIMARY KEY)",
);
