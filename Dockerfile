#Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json tsconfig*.json firebase-settings*.json nginx.conf ./

RUN npm cache clean --force

RUN npm install
RUN npm uninstall sharp
RUN npm install --platform=linux --arch=x64 sharp
RUN npm install body-parser
COPY . .

RUN npm run build

#Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json firebase-settings*.json nginx.conf .env ./

COPY .env /app/.env
COPY firebase-settings.json /app/firebase-settings.json

RUN npm cache clean --force

RUN npm install --only=production

COPY --from=build /app/build ./build

# Garantir que o .env está no local correto
RUN ls -la /app

CMD ["npm", "start"]