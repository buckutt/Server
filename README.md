# Buckless-Server
[![Build Status](https://travis-ci.org/buckless/Server.svg?branch=master)](https://travis-ci.org/buckless/Server) [![Coverage Status](https://coveralls.io/repos/github/buckless/Server/badge.svg?branch=master)](https://coveralls.io/github/buckless/Server?branch=master)  

Buckless is an electronic payment system.
It aims to remove almost any cashflow in your events.


## Requirements  
- Node.js v0.12 or higher
- RethinkDB
- openssl stable
- gulp
- chateau


## Installation

### Docker image
TODO

### Debian
```sh
$ npm install
```

#### gulp, chateau
```sh
$ npm install -g gulp chateau
```

#### RethinkDB
See [RethinkDB installation guide](https://www.rethinkdb.com/docs/install/).

#### SSL
```sh
# Edit configuration files

# Edit files ca.cnf, server.cnf and client1.cnf (duplicate client1.cnf for every device)

# CA
$ openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem

# Server
$ openssl genrsa -out server-key.pem 4096
$ openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem
$ openssl x509 -req -extfile server.cnf -days 999 -passin "pass:password" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem

# Client
$ openssl genrsa -out client1-key.pem 4096
$ openssl req -new -config client1.cnf -key client1-key.pem -out client1-csr.pem
$ openssl x509 -req -extfile client1.cnf -days 999 -passin "pass:password" -in $ client1-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out client1-crt.pem

# Check
$ openssl verify -CAfile ca-crt.pem client1-crt.pem

# Pack client key and certificate to be used in browsers
$ openssl pkcs12 -export -clcerts -in client1.crt -inkey client1.key -out client1.p12
```

## Usage
All following commands assumes there is a rethinkdb instance running.

### Start server
```sh
npm start
```

## Data explorer
```sh
chateau
```
Then, go to http://localhost:3000/.

##  Run tests

```sh
# Tests require eslint:
$ npm install -g eslint
$ npm run test:nocoverage
```

## License
MIT. See [LICENSE](LICENSE) file.