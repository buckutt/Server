const fs = require('fs');
const path = require('path');
const config = require('../../config');

const knex = require('knex')(config.db);
const bookshelf = require('bookshelf')(knex);

const modelsPath = path.join(__dirname, '..', 'models');
const models = {};

bookshelf.plugin('registry');
bookshelf.plugin('virtuals');
bookshelf.plugin('pagination');
bookshelf.plugin(require('bookshelf-uuid'));

bookshelf.plugin('bookshelf-manager', { root: modelsPath });
bookshelf.plugin(require('bookshelf-paranoia'), { field: 'deleted_at', sentinel: 'active' });

fs
    .readdirSync(modelsPath)
    .map((file) => {
        const { Model, name } = require(path.join(modelsPath, file))(bookshelf);

        models[name] = bookshelf.model(name, Model);
    });

function sync() {
    return knex.migrate.latest();
}

module.exports = { knex, bookshelf, models, sync };
