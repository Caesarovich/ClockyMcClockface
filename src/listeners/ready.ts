import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import type { StoreRegistryValue } from "@sapphire/pieces";
import {
	blue,
	gray,
	green,
	magenta,
	magentaBright,
	white,
	yellow,
} from "colorette";
import { ActivityType } from "discord.js";

const dev = process.env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public override run() {
		this.printBanner();
		this.printStoreDebugInformation();
		this.changeStatus();
	}

	private changeStatus() {
		this.container.client.user?.setActivity({
			type: ActivityType.Custom,
			name: "tick, tock, tick, tock...",
		});
	}

	private printBanner() {
		const success = green("+");

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc("");
		const line02 = llc("");
		const line03 = llc("");

		// Offset Pad
		const pad = " ".repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc("1.0.0")}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc("<")}${llc("/")}${blc(">")} ${llc("DEVELOPMENT MODE")}` : ""}
		`.trim(),
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];

		for (let i = 0; i < stores.length; i++) {
			const store = stores[i];
			logger.info(this.styleStore(store, i === stores.length - 1));
		}
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(
			`${last ? "└─" : "├─"} Loaded ${this.style(store.size.toString().padEnd(3, " "))} ${store.name}.`,
		);
	}
}
