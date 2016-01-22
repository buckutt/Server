# Buckless Server Specifications

* Usage of a NoSQL database (RethinkDB) : speed, node support, reliability.
* ES6 + Babel to get a clean JS code
* Goal : A REST API over ORM models
* Endpoints :
    - POST `/services/login`     : Logs a user to the server
    - POST `/services/logout`    : Logs out a user from the server
    - POST `/services/bucket`    : Treats a bucket validation (payments and reloads)
    - GET `/api/model/`          : Lists all documents of a model
    - GET `/api/model/id`        : Gets one specific document of a model
    - GET `/api/model/id/search` : Searches among the model documents
    - POST `/api/model`          : Creates a new document
    - PUT `/api/model/id`        : Updates an existing document
* Model descriptions :
    - Article     : what you buy
    - Category    : tabs in the seller view, or virtual to manage promotions
    - Config      : shared devices config
    - Device      : representation of a device
    - Fundation   : a non profit organization of the UTT
    - Group       : a group of users
    - MeanOfLogin : a way for the user to connect (a way to identify the user : mail, id, etc.)
    - Period      : A start-end period, mainly used by points
    - Point       : A sell point, such as Internet, parties, university home, etc.
    - Price       : An article price or a promotion price
    - Promotion   : A special offer that can target articles or categories
    - Purchase    : A trace of what users have paid
    - Reload      : A trace of what users have put on Buckless
    - Right       : A user right
    - User        : A student
* Database : See src/models/ or db.mwb. Some notes here :
    - Usage of four tables Article, Category, Promotion and Sets to avoid the « all-in-articles » mess
    - A price is unique and has many articles
    - A promotion can target a specific item, or a whole set
    - A promotion can target the same item multiple times, or a set multiple times, that's why the relation between
      them is n:n (to get a junction table)
    - A point should be highly configurable, with specific dates of use, etc.
    - There should not be data in the junction table that is not the relation itself. A relation is not data.
    - Based on the last point, MeanOfLogin can't just be a mean of login and the relation carrying the data.
      A MeanOfLogin has a type (that is the mean) and a data string next to it.
    - ReloadType is merged into Reload.trace
* More notes :
    - There should be virtual categories to allow exceptions in promotions. Eg, 1€ pack containing a drink (the whole
      category except Redbull) and a bar. New table to be made : Set, and promotions should be treated with sets and no
      more categories
    - A reload should be in the bucket to be cancelable, and all the bucket should be treated in one request
* Login :
    - JWT should be revocated when rights are updated. One solution should be to make tables with jwt stored, and check
    the supplied token is in the database. Lot of implementation needed, especially for the jwt automatic expiration.
    The other solution, the classic way, is that the token should contain only id, and fetch the rights on every request
    instead of fetching tokens on every request. Be careful, there was a difference between rights stored and rights
    used (req.user.rights) as used rights are filtred (based on pin/password and right expiration)
    - Do not use failedAuth => use haproxy/nginx/iptables to do that
    -> Finally, there should not be any right revocation (seller should keep his rights until disconnect)
* Offline :
    Store on the card the amount and reloads ids. Then when the card is used on an online device, lists the internet reloads
    removes the one on the card, and rewrite the card to take in the new reloads. Unique ids and not amounts
