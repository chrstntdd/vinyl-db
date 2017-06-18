var path = require('path');
const webpack = require('webpack');


module.exports = {
  cache: true,
  entry: ['babel-polyfill', './public/app.js'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      comments: false,
    }),
  ],
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    }],
  }
};