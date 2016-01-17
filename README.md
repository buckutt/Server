# Buckutt-Server

## Installation

Required : node/io.js, npm, rethinkdb, mocha, gulp, openssl
Optional : chateau

```sh
source /etc/lsb-release && echo "deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- http://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install node npm rethinkdb openssl
sudo npm install -g chateau mocha gulp
npm install
```

### SSL

```sh
# Edit configuration files

Edit files ca.cnf, server.cnf and client1.cnf (duplicate client1.cnf for every device)

# CA
openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem

# Server
openssl genrsa -out server-key.pem 4096
openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem
openssl x509 -req -extfile server.cnf -days 999 -passin "pass:password" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem

# Client
openssl genrsa -out client1-key.pem 4096
openssl req -new -config client1.cnf -key client1-key.pem -out client1-csr.pem
openssl x509 -req -extfile client1.cnf -days 999 -passin "pass:password" -in client1-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out client1-crt.pem

# Check
openssl verify -CAfile ca-crt.pem client1-crt.pem

# Pack client key and certificate to be used in browsers
openssl pkcs12 -export -clcerts -in client1.crt -inkey client1.key -out client1.p12
```

## Starting

```sh
npm run startdb # db server in background
npm run start # compile + start
```

## Testing

```sh
npm run startdb # db server in background
npm run test # compile + start in test environment
```

## Cleaning

```sh
npm run stopdb # kills properly rethinkdb
npm run cleardb # removes rethinkdb_data directory (clear all the database)
npm run clean # removes the compiled (app) directory
```

## Chateau

Chateau is another admin tool that has the only advantage to see table contents without going in the data explorer
and type `r.db('db').table('table')`.
Usage :
```sh
chateau
```

Then, go to http://localhost:3000/. The application may say sometimes that an error occured while emptying tables, or
whatever. Ignore it, they're functionning.
