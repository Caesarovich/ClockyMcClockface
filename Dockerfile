FROM oven/bun:1.1.34-alpine

RUN apk add --no-cache ffmpeg

# Install dependencies needed by node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY . .

RUN bun install

RUN bun run build --frozen-lockfile

ENV NODE_ENV=production

CMD [ "bun", "run", "start" ]