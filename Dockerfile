FROM node:22.4.1-alpine

WORKDIR /myfolder

COPY package*.json ./

RUN apk add --no-cache tzdata && npm ci --prefer-offline

COPY . .

ENV TZ Asia/Seoul

ENV PORT=${SERVER_PORT}

EXPOSE ${PORT}

CMD ["npm", "run", "start:dev"]