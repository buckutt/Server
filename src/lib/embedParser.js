const { models } = require('./bookshelf');

console.log(models.User);

function keyToModel(key) {
    return models[key.slice(0, 1).toUpperCase() + key.slice(1)];
}

function embedObject(tree) {
    const embed = {
        include: []
    };

    Object.keys(tree).forEach((key) => {
        if (typeof tree[key] === 'object') {
            embed.include.push({
                model  : keyToModel(key),
                include: embedObject(tree[key]).include
            });

            return;
        }

        if (tree[key]) {
            embed.include.push({
                model: keyToModel(key)
            });
        }
    });

    return embed;
}

module.exports = tree => embedObject(tree);
