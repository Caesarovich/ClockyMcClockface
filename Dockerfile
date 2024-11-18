FROM oven/bun:1.1.34-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY . .

RUN bun install

RUN bun run build

ENV NODE_ENV=production

CMD [ "bun", "run", "start" ]