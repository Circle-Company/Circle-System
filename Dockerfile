FROM node:alpine
WORKDIR /usr/app

COPY package*.json ./
RUN npm install

RUN npx sequelize db:migrate

COPY . .
EXPOSE 3000 3001

CMD [{"tsx", "./src/index.ts"}]