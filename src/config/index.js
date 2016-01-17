import path from 'path';

const secret   = 'NgWlfDWCbX4mPuxau1FmG3TPLHm7iglEA3mp1f8nrlT7zKDn8ZZAwWQOqUArvQBFfMEbFSAMnUHzgQW1FkczTiZYjPZWqdseNtk2';
const env      = process.env.NODE_ENV || 'development';

/* eslint-disable */
const rightsManagement = {
    all     : ['admin'],
    seller  : {
        read : [
            '/articles',
            '/articles/search',
            '/promotions',
            '/promotions/search',
            '/sets',
            '/sets/search',
            '/meansoflogin',
            '/meansoflogin/search',
            '/meansofpayment',
            '/meansofpayment/search',
            '/devices',
            '/devices/search',
            '/users'
        ],
        write: [
            '/services/basket'
        ]
    },
    reloader: {
        read : [
            '/users',
            '/usersrights',
            '/usersgroups',
            '/devicespoints',
            '/devices',
            '/reloadtypes',
            '/meanofloginsusers'
        ],
        write: [
            '/services/reload'
        ]
    }
};
/* eslint-enable */

const pinLoggingAllowed = ['seller'];

const config = require(`./${env}.json`);

config.secret            = secret;
config.rightsManagement  = rightsManagement;
config.pinLoggingAllowed = pinLoggingAllowed;
config.root              = path.join(__dirname, '..');

export default config;
