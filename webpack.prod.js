const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",

  output: {
    filename: "[name].[contenthash].js",
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],

  optimization: {
    minimizer: [
      `...`,
      // minify css
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],

    // bundle splitting - node_modules bundled into separate file
    splitChunks: {
      cacheGroups: {
        default: {
          test: /node_modules/,
          chunks: "all",
          filename: "vendor.[contenthash].js",
        },
      },
    },
  },
});
