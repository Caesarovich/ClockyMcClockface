import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

@ApplyOptions<Command.Options>({
	description: "Invite me to your server",
	preconditions: ["GuildOnly"],
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		];

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
		return this.sendInvite(interaction);
	}

	private async sendInvite(interaction: Command.ChatInputCommandInteraction) {
		// Send the invite link
		await interaction.reply({
			content: `Invite me to your server with this link: <https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}>`,
		});
	}
}
