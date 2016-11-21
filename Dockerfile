FROM mhart/alpine-node:latest

RUN apk update && \
    apk add --no-cache git openssh && \
    mkdir -p /usr/src/buckless-server

WORKDIR /usr/src/buckless-server

COPY . /usr/src/buckless-server/

RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
