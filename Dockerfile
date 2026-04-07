FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app
COPY package.json tsconfig.json ./
COPY apps ./apps
COPY libs ./libs
COPY config ./config

RUN npm install
RUN npx playwright install --with-deps chromium

CMD ["npm", "run", "start:worker"]
