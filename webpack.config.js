const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        factom: './src/factom.js',
        'factom-struct': './src/factom-struct',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
    },
    resolve: {
        fallback: {
            https: require.resolve('https-browserify'),
            http: require.resolve('stream-http'),
            buffer: require.resolve('buffer/'),
            url: require.resolve('url/'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env'],
                        plugins: [
                            '@babel/transform-runtime',
                            '@babel/transform-async-to-generator',
                            '@babel/transform-modules-commonjs',
                        ],
                    },
                },
            },
        ],
    },
};
