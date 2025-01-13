#Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json tsconfig*.json firebase-settings*.json ./

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

COPY package*.json firebase-settings*.json .env ./

RUN npm cache clean --force

RUN npm install

COPY --from=build /app/build ./build
CMD ["npm", "start"]