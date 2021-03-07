/* eslint-disable import/no-commonjs */

const path = require("path");
const nodeExternals = require("webpack-node-externals");
const EntrypointsPlugin = require("./config/EntrypointsPlugin.js");

module.exports = [
  {
    mode: "development",
    entry: ["@babel/polyfill", "./src/server.js"],
    output: {
      path: path.join(__dirname, "dist"),
      filename: "server.js",
      libraryTarget: "commonjs2",
      publicPath: "/"
    },
    target: "node",
    node: {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false
    },
    externals: nodeExternals(),
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader"
            }
          ]
        }
      ]
    },
    resolve: {
      alias: {
        widgets: path.resolve(__dirname, "src/widgets/")
      }
    }
  },
  {
    mode: "development",
    entry: {
      client: ["@babel/polyfill", "./src/client.js"]
      // vendor: [
      //   "react",
      //   "react-dom",
      //   "react-redux",
      //   "redux",
      //   "redux-devtools-extension",
      //   "redux-observable",
      //   "rxjs"
      // ]
    },
    output: {
      path: path.join(__dirname, "dist/assets"),
      publicPath: "/",
      filename: "[name].bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader"
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        widgets: path.resolve(__dirname, "src/widgets/")
      }
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          widget: {
            name(module, chunks, cacheGroupKey) {
              const moduleFileName = module
                .identifier()
                .split("/")
                .reduceRight((item) => item);
              return `${cacheGroupKey}-${moduleFileName}`;
            },
            chunks: "all",
            minSize: 0,
            minChunks: 1,
            reuseExistingChunk: true,
            priority: 10000,
            enforce: true,
            test: /[\\/]widgets[\\/]/
          }
        }
      }
    },
    plugins: [
      new EntrypointsPlugin({
        filename: "entrypoints.json",
        space: 2
      })
    ]
  }
];
