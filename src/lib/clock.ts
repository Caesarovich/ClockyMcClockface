import { createReadStream } from "node:fs";
import {
	type AudioPlayer,
	AudioPlayerStatus,
	type AudioResource,
	createAudioPlayer,
	createAudioResource,
	type DiscordGatewayAdapterCreator,
	entersState,
	joinVoiceChannel,
	type VoiceConnection,
	VoiceConnectionStatus,
} from "@discordjs/voice";

import { container } from "@sapphire/framework";
import type { Guild, VoiceBasedChannel } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { type GuildPreferences, guildPreferences } from "../db/schema";
import { audioPaths } from "./constants";
import { getVoiceChannelInfo } from "./utils";

export type Hour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export function isHour(value: number): value is Hour {
	return value >= 1 && value <= 12;
}

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
		} catch (_error) {
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

async function subscribePlayerToChannel(
	channel: VoiceBasedChannel,
	player: AudioPlayer,
) {
	container.logger.info(`Playing clock in ${getVoiceChannelInfo(channel)}`);

	const connection = createConnection(channel);

	connection.subscribe(player);

	player.on(AudioPlayerStatus.Idle, () => {
		connection.destroy();
		container.logger.debug("Clock sound finished playing");
	});
}

async function playClockWithHour(channels: VoiceBasedChannel[], hour: Hour) {
	const audioResource = createAudioResource(
		createReadStream(audioPaths[`${hour}-oclock`]),
	);

	const player = createPlayer();

	for (const channel of channels) {
		subscribePlayerToChannel(channel, player);
	}

	player.on(AudioPlayerStatus.Idle, () => {
		player.stop();
	});

	player.play(audioResource);
}

function findChannel(guild: Guild, guildPref: GuildPreferences) {
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
	}

	return channel;
}

export async function playClockInAllGuilds() {
	const guildPrefs = await db
		.select()
		.from(guildPreferences)
		.where(eq(guildPreferences.enabled, true));

	// Group guilds by hour
	const guildsByHour: Map<Hour, VoiceBasedChannel[]> = guildPrefs.reduce(
		(acc, guildPref) => {
			const guild = container.client.guilds.cache.get(guildPref.guildId);

			if (!guild) {
				container.logger.warn(
					`Guild ${guildPref.guildId} not found - skipping playing clock`,
				);
				return acc;
			}

			const channel = findChannel(guild, guildPref);

			if (!channel) {
				return acc;
			}

			const guildTime = new Date().toLocaleString("en-US", {
				timeZone: guildPref.timezone,
			});

			const hours24 = new Date(guildTime).getHours();
			const hours12 = (((hours24 + 11) % 12) + 1) as Hour;

			if (!acc.has(hours12)) {
				acc.set(hours12, []);
			}

			acc.get(hours12)?.push(channel);

			return acc;
		},
		new Map<Hour, VoiceBasedChannel[]>(),
	);

	for (const [hour, channels] of guildsByHour) {
		playClockWithHour(channels, hour);
	}
}
