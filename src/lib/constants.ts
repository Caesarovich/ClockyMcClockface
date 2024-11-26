import { join } from "node:path";

export const rootDir = join(__dirname, "..", "..");
export const srcDir = join(rootDir, "src");
export const audioDir = join(rootDir, "audio");

export const audioPaths = {
	"1-oclock": join(audioDir, "1-oclock.ogg"),
	"2-oclock": join(audioDir, "2-oclock.ogg"),
	"3-oclock": join(audioDir, "3-oclock.ogg"),
	"4-oclock": join(audioDir, "4-oclock.ogg"),
	"5-oclock": join(audioDir, "5-oclock.ogg"),
	"6-oclock": join(audioDir, "6-oclock.ogg"),
	"7-oclock": join(audioDir, "7-oclock.ogg"),
	"8-oclock": join(audioDir, "8-oclock.ogg"),
	"9-oclock": join(audioDir, "9-oclock.ogg"),
	"10-oclock": join(audioDir, "10-oclock.ogg"),
	"11-oclock": join(audioDir, "11-oclock.ogg"),
	"12-oclock": join(audioDir, "12-oclock.ogg"),
} as const;
