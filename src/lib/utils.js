const util = require('util');

/**
 * Validates integer
 * @param  {String|Number} n The integer
 * @return {Boolean} True if n is an integer, false otherwise
 */
function isInt(n) {
    return !isNaN(n) && parseInt(Number(n)) == n && !isNaN(parseInt(n, 10)); // eslint-disable-line
}

/**
 * Pads a string if inferior to 10
 * @param  {String|Number} n The numeric value
 * @return {String} The padded number
 */
function pad2(n) {
    const str = String(n);

    return (str.length === 1) ? `0${str}` : str;
}

/**
 * Beautifully logs an Object
 * @param  {Object} obj The object to log
 * @return {String} The result colored string
 */
function pp(obj) {
    return util.inspect(obj, {
        showHidden: true,
        colors    : true
    });
}

/**
 * Clones an object
 * @param  {Mixed}    obj        The object to clone
 * @param  {Boolean} [deep=true] Optional. Deep cloning
 * @return {Mixed} The same object, but different reference
 */
function clone(obj, deep = true) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Copy constructor
    const result = obj.constructor();
    Object.keys(obj).forEach((key) => {
        result[key] = deep ? clone(obj[key]) : obj[key];
    });

    return result;
}

module.exports = { isInt, pad2, pp, clone };
