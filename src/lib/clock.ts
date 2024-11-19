import {
	AudioPlayerStatus,
	type AudioResource,
	type DiscordGatewayAdapterCreator,
	type VoiceConnection,
	VoiceConnectionStatus,
	createAudioPlayer,
	entersState,
	joinVoiceChannel,
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";

import { container } from "@sapphire/framework";
import { getVoiceChannelInfo } from "./utils";

function createConnection(channel: VoiceBasedChannel): VoiceConnection {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild
			.voiceAdapterCreator as DiscordGatewayAdapterCreator,
	});

	connection.on("stateChange", (oldState, newState) => {
		container.logger.debug(
			`Connection transitioned from ${oldState.status} to ${newState.status}`,
		);
	});

	// This handles the case where the bot is disconnected from the voice channel
	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
			// Seems to be reconnecting to a new channel - ignore disconnect
		} catch (error) {
			// Seems to be a real disconnect which SHOULDN'T be recovered from
			connection.destroy();
		}
	});

	return connection;
}

function createPlayer() {
	const player = createAudioPlayer();

	player.on(AudioPlayerStatus.Playing, () => {
		container.logger.debug("The audio player has started playing!");
	});

	player.on("error", (error) => {
		container.logger.error(`Error: ${error.message}`);
	});

	player.on("stateChange", (oldState, newState) => {
		container.logger.debug(
			`Audio player transitioned from ${oldState.status} to ${newState.status}`,
		);
	});

	return player;
}

export function playClockSound(
	channel: VoiceBasedChannel,
	resource: AudioResource,
) {
	container.logger.info(`Playing clock in ${getVoiceChannelInfo(channel)}`);

	const connection = createConnection(channel);

	const player = createPlayer();

	connection.subscribe(player);

	player.play(resource);

	player.on(AudioPlayerStatus.Idle, () => {
		connection.destroy();
		container.logger.debug("Clock sound finished playing");
	});
}
