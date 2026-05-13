FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/shared/node_modules /app/shared/node_modules
COPY --from=deps /app/backend/node_modules /app/backend/node_modules
COPY . .
RUN npm --workspace shared run build || true
RUN npm --workspace backend run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/shared/dist /app/shared/dist
COPY --from=build /app/shared/package.json /app/shared/package.json
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/package.json /app/backend/package.json
WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/index.js"]
