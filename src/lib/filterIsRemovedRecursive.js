function identity(doc) {
    return doc;
}

function filterIsRemovedRecursive(doc = []) {
    if (typeof doc === 'undefined') {
        return null;
    }

    if (Array.isArray(doc)) {
        return doc.map(item => filterIsRemovedRecursive(item)).filter(identity);
    } else if (doc.constructor === Object) {
        if (doc.isRemoved) {
            return null;
        }

        const copy = Object.assign({}, doc);

        Object.keys(copy).forEach((key) => {
            copy[key] = filterIsRemovedRecursive(copy[key]);
        });

        return copy;
    }
    return doc;
}

module.exports = filterIsRemovedRecursive;

