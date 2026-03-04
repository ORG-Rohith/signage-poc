# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /backend-poc

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /backend-poc/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]