const path = require('path');

module.exports = {
    mode: 'production',
    entry: { 
        'factom': './src/factom.js',
        'factom-struct': './src/factom-struct'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]',
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