const path = require("path");

module.exports = {
    mode: 'production',
    entry: './src/js/option.js',
    output: {
        filename: 'option.js',
        path: path.join(__dirname, 'proj/js')
    }
};