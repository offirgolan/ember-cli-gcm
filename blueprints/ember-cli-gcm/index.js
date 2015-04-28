/* globals module */

var EOL = require('os').EOL;

module.exports = {
    normalizeEntityName: function() {},
    afterInstall: function() {
        return this.insertIntoFile(
            'app/index.html',
            '    <link rel="manifest" href="manifest.json">', {
                after: '<link rel="stylesheet" href="assets/' + this.project.config().modulePrefix + '.css">' + EOL
            }
        );
    }
};
