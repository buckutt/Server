# Buckless-Server
[![dependencies Status](https://david-dm.org/buckless/server/status.png)](https://david-dm.org/buckless/server)
[![Build Status](https://travis-ci.org/buckless/Server.svg?branch=master)](https://travis-ci.org/buckless/Server)
[![Coverage Status](https://coveralls.io/repos/github/buckless/Server/badge.svg?branch=master)](https://coveralls.io/github/buckless/Server?branch=master)  

Buckless is an electronic payment system.
It aims to remove almost any cashflow in your events.


## Requirements
- Node.js v5 or higher
- RethinkDB
- openssl stable
- gulp
- chateau (optional)


## Installation

### Debian
```sh
$ npm install
```

#### gulp
```sh
$ npm install -g gulp
```

#### RethinkDB
See [RethinkDB installation guide](https://www.rethinkdb.com/docs/install/).

#### SSL
```sh
# Only once
$ npm run sslConfig
# Every time you need to add a device
$ npm run addDevice
```

## Usage
All following commands assumes there is a rethinkdb instance running.

### Start server
```sh
$ npm start
```

## Data explorer
```sh
$ chateau
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
