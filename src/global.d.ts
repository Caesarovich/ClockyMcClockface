declare module "bun" {
	interface Env {
		DB_FILE_NAME: string;
		DISCORD_TOKEN: string;
		DISCORD_ANALYTICS_TOKEN?: string;
	}
}
