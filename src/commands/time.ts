import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
	ApplicationIntegrationType,
	EmbedBuilder,
	InteractionContextType,
	time,
} from "discord.js";
import type { GuildPreferences } from "../db/schema";
import { getGuildPreferences } from "../lib/guildPreferences";

@ApplyOptions<Command.Options>({
	description: "Displays the current time information",
	preconditions: ["GuildOnly"],
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
		];

		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			integrationTypes,
			contexts,
		});
	}

	// Chat Input (slash) command
	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		// biome-ignore lint/style/noNonNullAssertion: This command is only available in guilds
		const prefs = await getGuildPreferences(interaction.guild!);

		return this.sendTime(interaction, prefs);
	}

	private async sendTime(
		interaction: Command.ChatInputCommandInteraction,
		guildPreferences: GuildPreferences,
	): Promise<void> {
		const now = new Date();

		const utcTime = now.toLocaleString("en-US", {
			timeZone: "UTC",
			timeStyle: "full",
			dateStyle: "full",
		});

		const guildTime = now.toLocaleString("en-US", {
			timeZone: guildPreferences.timezone,
			timeStyle: "full",
			dateStyle: "full",
		});

		const nextStrike = new Date();

		nextStrike.setHours(nextStrike.getHours() + 1);
		nextStrike.setMinutes(0);
		nextStrike.setSeconds(0);

		const embed = new EmbedBuilder()
			.setTitle("Current Time")
			.setDescription(`The clock will strike next ${time(nextStrike, "R")}.`)
			.setFields([
				{
					name: "UTC Time",
					value: utcTime,
				},
				{
					name: `Guild Time (${guildPreferences.timezone})`,
					value: guildTime,
				},
			]);

		await interaction.reply({
			embeds: [embed],
		});
	}
}
