FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY db ./db
ENV NODE_ENV=production
EXPOSE 4000
# Veritabanını hazırlar (veri varsa korur), sonra API'yi başlatır
CMD ["sh", "-c", "node src/scripts/initDb.js && node src/index.js"]
