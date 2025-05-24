FROM node:22.4.1-alpine

WORKDIR /client/

COPY . /client

ENV TZ Asia/Seoul

RUN npm install

CMD ["npm", "run", "dev"]