module.exports = {
    entry  : './src/game.js',
    output : {
        path     : './static',
        filename : 'app.dist.js'
    },
    module : {
        loaders: [
            {
                exclude: /node_modules/,
                loader : 'babel-loader',
                test   : /.js$/,
                query: {
                    presets: ['es2015']
                }
            },
            {
                loader: 'json',
                test: /\.json$/,
            },
        ]
    }
};

