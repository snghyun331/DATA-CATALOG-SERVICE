FROM node:22.4.1-alpine

WORKDIR /api/

COPY . /api

RUN apk add --no-cache tzdata && npm ci --prefer-offline

ENV TZ Asia/Seoul

CMD ["npm", "run", "start:dev"]