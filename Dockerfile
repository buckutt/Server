FROM node:alpine

EXPOSE 3000

CMD ["yarn", "start"]

WORKDIR /usr/src/buckless-server

RUN apk update && \
    apk add --no-cache git openssh openssl && \
    mkdir -p /usr/src/buckless-server

COPY package.json /usr/src/buckless-server/
COPY yarn.lock /usr/src/buckless-server/

RUN yarn

COPY . /usr/src/buckless-server/
