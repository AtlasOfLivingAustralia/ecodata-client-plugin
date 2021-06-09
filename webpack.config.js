const path = require('path');

module.exports = {
    entry: './grails-app/assets/javascripts/feature.js',
    output: {
        filename: 'feature-bundle.js',
        path: path.resolve(__dirname, './grails-app/assets/javascripts/')
    },
    target: ['web', 'es5']
};