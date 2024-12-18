import {
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload,
	container,
} from "@sapphire/framework";
import { cyan } from "colorette";
import type { APIUser, Guild, User, VoiceBasedChannel } from "discord.js";

export function logSuccessCommand(
	payload:
		| ContextMenuCommandSuccessPayload
		| ChatInputCommandSuccessPayload
		| MessageCommandSuccessPayload,
): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ("interaction" in payload) {
		successLoggerData = getSuccessLoggerData(
			payload.interaction.guild,
			payload.interaction.user,
			payload.command,
		);
	} else {
		successLoggerData = getSuccessLoggerData(
			payload.message.guild,
			payload.message.author,
			payload.command,
		);
	}

	container.logger.debug(
		`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`,
	);
}

export function getSuccessLoggerData(
	guild: Guild | null,
	user: User,
	command: Command,
) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

export function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

export function getGuildInfo(guild: Guild | null) {
	if (guild === null) return "Direct Messages";
	return `${guild.name}[${cyan(guild.id)}]`;
}

export function getVoiceChannelInfo(channel: VoiceBasedChannel) {
	return `${channel.name}[${cyan(channel.id)}]`;
}
