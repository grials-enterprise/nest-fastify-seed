# syntax=docker/dockerfile:1

# ---- Stage 1: install dependencies ----
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ---- Stage 2: merge files + build + run ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache tini

COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build && npm prune --omit=dev

USER node
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
