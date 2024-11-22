import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import {
	ApplicationIntegrationType,
	type AutocompleteInteraction,
	ChannelType,
	EmbedBuilder,
	InteractionContextType,
	PermissionFlagsBits,
	channelMention,
} from "discord.js";
import type { GuildPreferences } from "../db/schema";
import {
	getGuildPreferences,
	updateGuildPreferences,
} from "../lib/guildPreferences";

function configViewEmbed(prefs: GuildPreferences) {
	return new EmbedBuilder()
		.setTitle("Current Configuration")
		.setDescription(
			"You can change the configuration with the other `/config` commands. Configuration is limited to members with the `Manage Guild` permission.",
		)
		.setFooter({
			text: `Guild ID: ${prefs.guildId}`,
		})
		.setFields([
			{
				name: "Enabled",
				value: prefs.enabled ? "Yes" : "No",
			},
			{
				name: "Mode",
				value: prefs.mode,
			},
			{
				name: "Timezone",
				value: prefs.timezone,
			},
			{
				name: "Static Channel",
				value: prefs.staticChannelId
					? channelMention(prefs.staticChannelId)
					: "Not set",
			},
		]);
}

@ApplyOptions<Command.Options>({
	description: "Configure the settings for the bot",
	preconditions: ["GuildOnly"],
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
		];

		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(contexts)
				.setIntegrationTypes(integrationTypes)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("view")
						.setDescription("View the current configuration"),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("enable")
						.setDescription("Enables the bot (will play the clock every hour)"),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("disable")
						.setDescription(
							"Disables the bot (will NOT play the clock every hour)",
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("mode")
						.setDescription("Set the mode for the bot")
						.addStringOption((option) =>
							option
								.setName("mode")
								.setDescription(
									"Dynamic: Play the clock in the channel where users are active. Static: Play in a specific channel",
								)
								.setRequired(true)
								.addChoices([
									{
										name: "Dynamic",
										value: "dynamic",
									},
									{
										name: "Static",
										value: "static",
									},
								]),
						)
						.addChannelOption((option) =>
							option
								.setName("static-channel")
								.setDescription(
									"(Optional) The channel where the clock will be played in. Required for static mode.",
								)
								.addChannelTypes([ChannelType.GuildVoice])
								.setRequired(false),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("timezone")
						.setDescription("Set the timezone for the bot")
						.addStringOption((option) =>
							option
								.setName("timezone")
								.setDescription("Search for a timezone")
								.setRequired(true)
								.setAutocomplete(true),
						),
				),
		);
	}

	private async setEnabled(
		interaction: Command.ChatInputCommandInteraction,
		enabled: boolean,
	) {
		// biome-ignore lint/style/noNonNullAssertion: This command is guild only
		await updateGuildPreferences({ guildId: interaction.guild!.id, enabled });

		await interaction.reply({
			content: `The bot is now ${enabled ? "enabled" : "disabled"}`,
			ephemeral: true,
		});
	}

	private async setTimeZone(
		interaction: Command.ChatInputCommandInteraction,
		timezone: string,
	) {
		if (!Intl.supportedValuesOf("timeZone").includes(timezone)) {
			await interaction.reply({
				content:
					"Error: Invalid timezone provided (see `/config timezone` for a list of valid timezones)",
				ephemeral: true,
			});
			return;
		}

		// biome-ignore lint/style/noNonNullAssertion: This command is guild only
		await updateGuildPreferences({ guildId: interaction.guild!.id, timezone });

		await interaction.reply({
			content: `The timezone is now set to **${timezone}**`,
			ephemeral: true,
		});
	}

	private async setMode(
		interaction: Command.ChatInputCommandInteraction,
		mode: string,
		channelId?: string,
	) {
		if (!["dynamic", "static"].includes(mode)) {
			return await interaction.reply({
				content: "Error: Invalid mode provided",
				ephemeral: true,
			});
		}

		if (mode === "static" && !channelId) {
			return await interaction.reply({
				content:
					"Error: You must provide a channel when setting the mode to static",
				ephemeral: true,
			});
		}

		await updateGuildPreferences({
			// biome-ignore lint/style/noNonNullAssertion: This command is guild only
			guildId: interaction.guild!.id,
			mode: mode as "dynamic" | "static",
			staticChannelId: channelId,
		});

		return await interaction.reply({
			content: `The mode is now set to **${mode}**`,
			ephemeral: true,
		});
	}

	private async viewConfig(interaction: Command.ChatInputCommandInteraction) {
		// biome-ignore lint/style/noNonNullAssertion: This command is guild only
		const prefs = await getGuildPreferences(interaction.guild!);

		await interaction.reply({
			embeds: [configViewEmbed(prefs)],
			ephemeral: true,
		});
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand === "enable") await this.setEnabled(interaction, true);
		else if (subcommand === "disable")
			await this.setEnabled(interaction, false);
		else if (subcommand === "mode") {
			const mode = interaction.options.getString("mode", true);
			const channelId = interaction.options.getChannel(
				"static-channel",
				false,
			)?.id;
			await this.setMode(interaction, mode, channelId);
		} else if (subcommand === "timezone") {
			const timezone = interaction.options.getString("timezone", true);
			await this.setTimeZone(interaction, timezone);
		} else if (subcommand === "view") await this.viewConfig(interaction);
	}

	private searchTimezones(searchString: string) {
		const timezones = Intl.supportedValuesOf("timeZone");

		return timezones
			.filter((timezone) =>
				timezone.toLowerCase().includes(searchString.toLowerCase()),
			)
			.slice(0, 25)
			.map((timezone) => ({ name: timezone, value: timezone }));
	}

	public override autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedOption = interaction.options.getFocused(true);

		switch (focusedOption.name) {
			case "timezone": {
				const search = interaction.options.getString("timezone", true);
				return interaction.respond(this.searchTimezones(search));
			}

			default: {
				return interaction.respond([]);
			}
		}
	}
}
