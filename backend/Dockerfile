FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl netcat-openbsd curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci


COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

CMD ["/wait-for-db.sh", "node", "dist/server.js"]
