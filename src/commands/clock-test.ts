import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

import { createAudioResource } from "@discordjs/voice";
import { playClockSound } from "../lib/clock";
import { audioUrls } from "../lib/constants";

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
		return this.sendPing(interaction);
	}

	private async sendPing(
		interaction: Command.ChatInputCommandInteraction,
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

		playClockSound(voiceChat, createAudioResource(audioUrls.clockBellChimes));

		interaction.reply({
			content: "Playing the clock sound",
			ephemeral: true,
		});
	}
}
