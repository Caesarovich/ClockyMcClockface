import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { type Guild, userMention } from "discord.js";
import { db } from "../lib/db";
import { getGuildInfo } from "../lib/utils";

@ApplyOptions<Listener.Options>({})
export class UserEvent extends Listener<"guildCreate"> {
	public override run(guild: Guild) {
		this.container.logger.info(
			`Joined guild: ${getGuildInfo(guild)} with ${guild.memberCount} members`,
		);

		const clientId = this.container.client.user?.id;
		if (!clientId) return;

		const mention = userMention(clientId);
		mention;

		// guild.systemChannel?.send(
		// 	`Hello! I am ${mention}! Thank you for inviting me to your server! You can configure me by using my **slash commands** !`,
		// );

		db;
	}
}
