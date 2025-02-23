#Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copia apenas arquivos essenciais para instalar dependências corretamente
COPY package*.json ./ 
COPY tsconfig*.json ./ 

RUN npm install
RUN npm uninstall sharp
RUN npm install --platform=linux --arch=x64 sharp
RUN npm install body-parser
COPY . .

RUN npm run build

# Define o comando de inicialização do container
CMD ["npm", "start"]

#Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copia apenas os arquivos necessários da fase de build
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/nginx.conf ./nginx.conf

RUN npm install --only=production

# Garantir que o .env está no local correto
RUN ls -la /app

CMD ["npm", "start"]