# ClockyMcClockface

This is a Discord bot that will play clock sounds in voice chat every hour. It can be useful to remind you of the time, or just to annoy your friends :)

## Development

### Requirements
This project uses the [Bun](https://bun.sh/) runtime and its SQLite driver. It also requires [FFmpeg](https://ffmpeg.org/) to be installed to play audio files.

You can use the [Devcontainer](https://containers.dev/) configuration to easily develop this project in a containerized environment.

If you are on [NixOS](https://nixos.org/), you can use the provided `flake.nix` file to get a development environment with all the required dependencies by running the following command:

```sh
nix develop
```

### Running

To run the project, you can use the following command:

```sh
bun run dev
```

If you want to automatically reload the project when the source code changes, you can use the following command:

```sh
bun run watch:start
```

You must provide a volume to store the SQLite database file if you want to persist the data between runs. 

## Environment Variables

This project requires the following environment variables to be set:

- `DISCORD_TOKEN`: The Discord bot token
- `DB_FILE_NAME`: The SQLite database file name (default: `database.sqlite`)

You can copy the `.env.example` file to `.env` and set the values there.

## Production

You can build the Docker image for production with the following command:

```sh
docker build -t clockymcclockface .
```

And then run the image with the following command:

```sh
docker run -d --name clockymcclockface -v /path/to/database.sqlite:/app/database.sqlite -e DISCORD_TOKEN=your_token clockymcclockface
```

## Tech Stack

- [Bun](https://bun.sh/) - A fast all-in-one toolkit and runtime for modern JavaScript
- [Discord.js](https://discord.js.org/) - A powerful library for interacting with the Discord API
- [Sapphire Framework](https://www.sapphirejs.dev/) - A framework for building Discord bots with TypeScript
- [Biome](https://biomejs.dev/) - Fast linter and formatter for the web
- [Drizzle ORM](https://orm.drizzle.team/) - A fast and type-safe ORM for TypeScript

## License

This project's source code is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The audio files are from [pixabay](https://pixabay.com/music/), and are licensed under the Pixabay License.