import { join } from "node:path";

export const rootDir = join(__dirname, "..", "..");
export const srcDir = join(rootDir, "src");

export const audioUrls = {
	clockBellChimes:
		"https://cdn.pixabay.com/download/audio/2022/03/15/audio_a967299fff.mp3",
} as const;
