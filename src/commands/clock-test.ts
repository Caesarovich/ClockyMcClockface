import { createReadStream } from "node:fs";
import { createAudioResource } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";
import { type Hour, isHour, playClockSound } from "../lib/clock";
import { audioPaths } from "../lib/constants";

@ApplyOptions<Command.Options>({
	description: "Plays a test sound in your voice channel",
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
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(contexts)
				.setIntegrationTypes(integrationTypes)
				.addIntegerOption((option) =>
					option
						.setName("hour")
						.setDescription("which hour to play the sound")
						.setRequired(false)
						.setMinValue(1)
						.setMaxValue(12),
				),
		);
	}

	// Chat Input (slash) command
	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const hour = interaction.options.getInteger("hour") ?? 12;

		if (!isHour(hour)) {
			await interaction.reply("Invalid hour");
			return;
		}

		return this.playClock(interaction, hour);
	}

	private async playClock(
		interaction: Command.ChatInputCommandInteraction,
		hour: Hour,
	): Promise<void> {
		if (!interaction.member) return;

		const member = await interaction.guild?.members.fetch(
			interaction.member?.user.id,
		);

		if (!member) {
			await interaction.reply("Error: Member not found");
			return;
		}

		const voiceChat = member.voice.channel;

		if (!voiceChat) {
			interaction.reply(
				"You need to be in a voice channel to use this command",
			);
			return;
		}

		const audioResource = createAudioResource(
			createReadStream(audioPaths[`${hour}-oclock`]),
		);

		playClockSound(voiceChat, audioResource);

		interaction.reply({
			content: "Playing the clock sound",
			ephemeral: true,
		});
	}
}
