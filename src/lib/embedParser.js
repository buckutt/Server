const hasDot = str => str.indexOf('.') > 0;

const removeLevel = embed => embed
    .filter(rel => hasDot(rel))
    .map(rel => rel.split('.').slice(1).join('.'));

const embedParser = embed => embed.map((relation) => {
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
    };
});

/* eslint no-use-before-define: 0 */
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

const embedFilter = (embed, results_) => {
    const filterList = embed.filter(rel => !hasDot(rel));
    let results      = results_;

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

module.exports.embedParser = embedParser;
module.exports.embedFilter = embedFilter;
