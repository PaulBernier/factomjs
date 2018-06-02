const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/factom.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'factom.js',
        library: 'factom',
        libraryTarget: 'umd'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime', 'transform-async-to-generator']
                }
            }
        }]
    },
};