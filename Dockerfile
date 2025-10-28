FROM oven/bun:1.3.1-alpine

RUN apk add --no-cache ffmpeg nodejs npm

# Install dependencies needed by node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --production

RUN bun run build

ENV NODE_ENV=production

CMD [ "npm", "run", "start" ]