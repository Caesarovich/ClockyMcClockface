import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { CronJob } from "cron";
import { GatewayIntentBits } from "discord.js";

import DiscordAnalytics from "discord-analytics/discordjs";
import { playClockInAllGuilds } from "./lib/clock";

const client = new SapphireClient({
	defaultPrefix: "!",
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug,
	},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
	loadMessageCommandListeners: false,
});

if (Bun.env.DISCORD_ANALYTICS_TOKEN) {
	// Create Discord Analytics instance
	const analytics = new DiscordAnalytics({
		client: client,
		apiToken: Bun.env.DISCORD_ANALYTICS_TOKEN,
	});

	analytics.trackEvents();

	client.logger.info("Discord Analytics initialized");
}

const main = async () => {
	try {
		client.logger.info("Logging in");
		await client.login(Bun.env.DISCORD_TOKEN);
		client.logger.info(`Logged in as ${client.user?.tag}`);

		CronJob.from({
			cronTime: "0 0 * * * *",
			onTick: async () => {
				client.logger.info("Playing clock in all guilds");
				await playClockInAllGuilds();
			},
			start: true,
			timeZone: "UTC",
		});
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
