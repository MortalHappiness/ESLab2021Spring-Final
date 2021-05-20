var path = require('path');
var pkg = require('./package.json')
var util = require('util');
var entry = {
  app: ['./app.js']
};

module.exports = {
    context: path.join(__dirname, 'app'),
    entry: entry,
    target : 'web',
    output: {
        path: path.resolve(pkg.config.buildDir),
        publicPath: "/",
        filename: "bundle.js"
    },
    node: {
      fs: 'empty'
    },
    module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader", query:{presets:['es2015']}},
          { test: /\.html$/, exclude: /node_modules/, loader: "file-loader?name=[path][name].[ext]"}
        ]
    }
};
