FROM mhart/alpine-node:latest

EXPOSE 3000

CMD ["npm", "start"]

WORKDIR /usr/src/buckless-server

RUN apk update && \
    apk add --no-cache git openssh openssl python make gcc g++ pcsc-lite-dev && \
    mkdir -p /usr/src/buckless-server

COPY package.json /usr/src/buckless-server/

RUN npm install

COPY . /usr/src/buckless-server/
