/**
 * Copyright(c) 2026 The rainway-ai-gateway Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: //www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Copyright (c) 2021 The BFE Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var path = require('path');
var config = require('./config');
var VueLoaderPlugin = require('vue-loader/lib/plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var projectRoot = path.resolve(__dirname, '../');

var env = process.env.NODE_ENV;
// check env & config/index.js to decide weither to enable CSS Sourcemaps for the
// various preprocessor loaders added to vue-loader at the end of this file
var cssSourceMapDev = env === 'development' && config.dev.cssSourceMap;
var cssSourceMapProd = env === 'production' && config.build.productionSourceMap;
var useCssSourceMap = cssSourceMapDev || cssSourceMapProd;

var cssExtractDev = env === 'development' && config.dev.cssExtract;
var cssExtractProd = env === 'production';
var useCssExtract = cssExtractDev || cssExtractProd;

var assetsPath = function (_path) {
  var assetsSubDirectory =
    process.env.NODE_ENV === 'production'
      ? config.build.assetsSubDirectory
      : config.dev.assetsSubDirectory;
  return path.posix.join(assetsSubDirectory, _path);
};

module.exports = {
  entry: {
    app: './src/main.js',
  },
  output: {
    path: config.build.assetsRoot,
    publicPath:
      process.env.NODE_ENV === 'production'
        ? config.build.assetsPublicPath
        : config.dev.assetsPublicPath,
    filename: '[name].js',
    chunkFilename: '[name].js',
  },
  resolve: {
    modules: [path.join(__dirname, '../node_modules')],
    extensions: ['.js', '.vue', '.less', '.css', '.scss'],
    alias: {
      vue$: 'vue/dist/vue.common.js',
      'vue-router$': 'vue-router/dist/vue-router.common.js',
      '@': path.resolve('src'),
      src: path.resolve(__dirname, '../src'),
      common: path.resolve(__dirname, '../src/components'),
    },
    symlinks: false,
  },
  externals: [
    {
      xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}',
    },
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
        include: [path.resolve(__dirname, '../src')],
      },
      {
        test: /\.css$/,
        use: [
          useCssExtract ? MiniCssExtractPlugin.loader : 'vue-style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: useCssSourceMap,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          useCssExtract ? MiniCssExtractPlugin.loader : 'vue-style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: useCssSourceMap,
            },
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: useCssSourceMap,
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10000,
          },
        },
        generator: {
          filename: assetsPath('img/[name][ext]'),
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10000,
          },
        },
        generator: {
          filename: assetsPath('fonts/[name][hash:7][ext]'),
        },
      },
    ],
  },
  plugins: [
    // make sure to include the plugin!
    new VueLoaderPlugin(),
  ],
};
