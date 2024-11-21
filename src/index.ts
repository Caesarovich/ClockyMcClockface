import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

import DiscordAnalytics from "discord-analytics/discordjs";

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
		apiToken: "YOUR_API_TOKEN",
	});

	analytics.trackEvents();

	client.logger.info("Discord Analytics initialized");
}

const main = async () => {
	try {
		client.logger.info("Logging in");
		await client.login(process.env.DISCORD_TOKEN);
		client.logger.info("logged in");
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
