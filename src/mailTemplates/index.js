const fs   = require('fs');
const path = require('path');
const dot  = require('dot');

const templateSettings = {
  evaluate   :    /\{\{([\s\S]+?)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  varname    : 'it',
  strip      : false,
};

const templates = fs
    .readdirSync(__dirname)
    .filter(f => f !== 'index.js')
    .map(name => {
        const htmlTpl = fs.readFileSync(path.join(__dirname, name, 'mail.html')).toString();
        const textTpl = fs.readFileSync(path.join(__dirname, name, 'mail.txt')).toString();

        const html = dot.template(htmlTpl, templateSettings);
        const text = dot.template(textTpl, templateSettings);

        return { name, html, text };
    });

module.exports = (name, data) => {
    const mail = templates.find(template => template.name === name);

    if (!mail) {
        throw new Error(`Cannot find template ${name}`);
    }

    return {
        html: mail.html(data),
        text: mail.text(data)
    }
}
