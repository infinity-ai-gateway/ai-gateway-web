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
<template>
  <div v-if="!node.children" class="navItem">
    <MenuItem :name="node.id"
      ><Icon :custom="navIcon[node.id]" />{{ $t(`nav.${node.text}`) }}</MenuItem
    >
  </div>
  <div v-else>
    <Submenu :name="node.id">
      <template slot="title"
        ><Icon
          :custom="navIcon[node.id]"
        />{{ $t(`nav.${node.text}`) }}</template
      >
      <navItem
        v-for="t in node.children"
        :key="t.id"
        :name="t.id"
        :node="t"
      ></navItem>
    </Submenu>
  </div>
</template>

<script>
export default {
    name: 'navItem',
    data() {
        return {
            navIcon: {
                'AIGatewayInstancePool.list': 'iconfont icon-instancePool',

                'certs.list': 'iconfont icon-cert',
                'user.list': 'iconfont icon-user',

                'APIKey.list': 'ivu-icon-ios-key',
                'QuotaControl.list': 'ivu-icon-md-apps',
                'ai_route.list.admin': 'iconfont icon-zhuanfa',
                'Entity.list': 'ivu-icon-ios-settings',

                'consumer.admin.list': 'ivu-icon-md-people',
                'route.admin.list': 'ivu-icon-ios-cube',
                'resource.admin.list': 'ivu-icon-md-appstore',
                'AICluster.list': 'iconfont icon-jiqun',
                'AdvanceRouteRule.list': 'iconfont icon-zhuanfa'
            }
        };
    },
    props: {
        node: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    methods: {}
};
</script>
