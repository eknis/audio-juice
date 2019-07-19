const path = require('path');

module.exports = {
  entry: ['@babel/polyfill', './src/index.js'],
  mode: "development",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'audioJuice.js',
    library: 'audioJuice'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
