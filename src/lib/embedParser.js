const embedParser = (embed) => {
    return embed.map((relation) => {
        if (typeof relation === 'string') {
            return relation;
        } else if (!relation.filters) {
            return relation.embed;
        }

        return {
            [relation.embed]: (query) => {
                let filteredQuery = query;

                relation.filters.forEach((filter) => {
                    filteredQuery = filteredQuery.where(...filter);
                });

                return filteredQuery;
            }
        }
    });
}
const embedFilter = (embed, results) => {
    const filterList = embed.filter(rel => !hasDot(rel));

    filterList.forEach((filter) => {
        results = results.filter((result) => {
            if (Array.isArray(result[filter])) {
                return result[filter].length > 0;
            } else if (typeof result[filter] === 'object') {
                return result[filter] && result[filter].id;
            }

            return true;
        });
    });

    results = results.map(result => propagate(embed, result));

    return results;
};

const propagate = (embed, result) => {
    const subEmbed = removeLevel(embed);

    if (subEmbed.length === 0) {
        return result;
    }

    Object.keys(result).forEach((key) => {
        if (Array.isArray(result[key])) {
            result[key] = embedFilter(subEmbed, result[key]);
        } else if (result[key] && result[key].constructor === Object) {
            result[key] = propagate(subEmbed, result[key]);
        }
    });

    return result;
};

const hasDot = (str) => str.indexOf('.') > 0;

const removeLevel = (embed) => {
    return embed
        .filter(rel => hasDot(rel))
        .map(rel => rel.split('.').slice(1).join('.'));
};

module.exports.embedParser = embedParser;
module.exports.embedFilter = embedFilter;
