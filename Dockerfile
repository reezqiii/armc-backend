FROM node:21.7.3

WORKDIR /app

# Install OS deps for Chromium (Puppeteer) + fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  libnspr4 libnss3 \
  libxkbcommon0 \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
  libdrm2 libgbm1 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 \
  libxfixes3 libxrandr2 libxrender1 libxshmfence1 libxss1 libxtst6 \
  libpango-1.0-0 libpangocairo-1.0-0 \
  fonts-liberation fonts-noto fonts-noto-cjk \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main.js"]
