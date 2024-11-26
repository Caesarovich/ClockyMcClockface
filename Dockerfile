FROM oven/bun:1.1.34-alpine

RUN apk add --no-cache ffmpeg nodejs npm

# Install dependencies needed by node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --production

RUN bun run build

ENV NODE_ENV=production

CMD [ "npm", "run", "start" ]