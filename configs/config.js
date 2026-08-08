/**
* Copyright(c) 2026 The Infinity AI Gateway Authors.
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
// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path');
var assetsPublicPath = '/';

var proxyTable = {};
try {
  var devProxyConfigs = require('./devProxy');
  proxyTable = devProxyConfigs.proxy;
} catch (err) {
  console.log('proxy file not existed');
}

module.exports = {
  build: {
    env: {
      NODE_ENV: '"production"',
    },
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: assetsPublicPath,
    productionSourceMap: false,
    productionGzip: true,
    productionGzipExtensions: ['js', 'css'],
  },
  dev: {
    env: {
      NODE_ENV: '"development"',
    },
    port: 8088,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: proxyTable,
    cssExtract: false,
    cssSourceMap: true,
  },
};
