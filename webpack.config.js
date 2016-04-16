module.exports = {
    entry  : './src/index.js',
    output : {
        path     : './static',
        filename : 'app.dist.js'
    },
    module : {
        loaders: [ {
                test   : /.js$/,
                loader : 'babel-loader'
            }
        ]
    }
};
 
