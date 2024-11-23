import {
	AudioPlayerStatus,
	type AudioResource,
	type DiscordGatewayAdapterCreator,
	type VoiceConnection,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	joinVoiceChannel,
} from "@discordjs/voice";
import type { Guild, VoiceBasedChannel } from "discord.js";

import { container } from "@sapphire/framework";
import { getVoiceChannelInfo } from "./utils";
import { db } from "../db";
import { guildPreferences } from "../db/schema";
import { eq } from "drizzle-orm";
import { audioUrls } from "./constants";

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

function findMostActiveChannel(guild: Guild): VoiceBasedChannel | null {
	let mostActiveChannel: VoiceBasedChannel | null = null;
	let mostActiveUsers = 0;

	for (const channel of guild.channels.cache.values()) {
		if (!channel.isVoiceBased()) continue;

		const voiceChannel = channel as VoiceBasedChannel;

		if (voiceChannel.members.size > mostActiveUsers) {
			mostActiveChannel = voiceChannel;
			mostActiveUsers = voiceChannel.members.size;
		}
	}

	return mostActiveChannel;
}

export async function playClockInAllGuilds() {
	const guildPrefs = await db
		.select()
		.from(guildPreferences)
		.where(eq(guildPreferences.enabled, true));

	const audioResource = createAudioResource(audioUrls.clockBellChimes);

	for (const guildPref of guildPrefs) {
		const guild = container.client.guilds.cache.get(guildPref.guildId);

		if (!guild) {
			container.logger.warn(
				`Guild ${guildPref.guildId} not found - skipping playing clock`,
			);
			continue;
		}

		let channel: VoiceBasedChannel | null = guild.channels.cache.get(
			guildPref.staticChannelId ?? "",
		) as VoiceBasedChannel;

		if (guildPref.mode === "dynamic") {
			channel = findMostActiveChannel(guild);
		}

		if (!channel) {
			container.logger.warn(
				`Channel ${guildPref.staticChannelId} not found in guild ${guild.id} - skipping playing clock`,
			);
			continue;
		}

		playClockSound(channel as VoiceBasedChannel, audioResource);
	}
}
