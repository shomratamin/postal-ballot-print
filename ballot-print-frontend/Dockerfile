FROM node:24-alpine
WORKDIR /app
COPY package.json /app/package.json
COPY tailwind.config.ts /app/tailwind.config.ts
COPY tsconfig.json /app/tsconfig.json
COPY next.config.js /app/next.config.js

RUN npm install

COPY . .
COPY production.e /app/.env
RUN npm run build

CMD ["npm", "start"]
