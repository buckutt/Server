/* eslint-disable func-names */

const assert              = require('assert');
const { isInt, pad2, pp } = require('../src/lib/utils');

describe('utils', () => {
    describe('isInt', () => {
        it('should validate ints', () => {
            assert.equal(true, isInt(1));
            assert.equal(true, isInt(0));
            assert.equal(true, isInt(-1));
        });

        it('should not validate anything else', () => {
            assert.equal(false, isInt(false));
            assert.equal(false, isInt('foo'));
            assert.equal(false, isInt({}));
            assert.equal(false, isInt([]));
            assert.equal(false, isInt(() => {}));
        });

        it('should not validate float and irrational numbers', () => {
            assert.equal(false, isInt(Math.INFINITY));
            assert.equal(false, isInt(Math.PI));
            assert.equal(false, isInt(0.1));
        });
    });

    describe('pad2', () => {
        it('should pad numbers', () => {
            assert.equal('01', pad2(1));
        });

        it('should pad string', () => {
            assert.equal('0a', pad2('a'));
        });

        it('should not pad if length > 2', () => {
            assert.equal('12', pad2(12));
        });
    });

    describe('pp', () => {
        it('should stringify objects and prettyprints them', () => {
            assert.equal('string', typeof pp({}));
        });
    });
});
