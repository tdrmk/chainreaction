const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: {
    bundle: ["./client/src/index.js", "./client/public/style.css"],
  },

  output: {
    filename: "[name].js",
    publicPath: "/static/", // the path used by express to serve static assets
    clean: true, // clean the dist folder before each build
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // 3. export it to file
          "css-loader", // 2. convert css into commonjs
          "postcss-loader", // 1. convert post css to css
        ],
      },
      {
        test: /\.html$/,
        use: "html-loader",
      },
    ],
  },

  plugins: [
    new HTMLWebpackPlugin({
      title: "Chain Reaction",
      template: path.join(__dirname, "client/public/index.html"),
    }),
  ],
};
