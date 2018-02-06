const fs    = require('fs');
const https = require('https');
const axios = require('axios');

module.exports = () => {
    const p12File = fs.readFileSync('ssl/certificates/test/test.p12');
    const caFile  = fs.readFileSync('ssl/certificates/ca/ca-crt.pem');

    const options = {
        pfx               : p12File,
        passphrase        : 'test',
        ca                : caFile,
        strictSSL         : false,
        rejectUnauthorized: false
    };

    return axios.create({
        baseURL: 'https://localhost:3006',
        agent  : new https.Agent(options)
    });
};
