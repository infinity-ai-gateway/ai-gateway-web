/**
* Copyright(c) 2026 The Rainway AI Gateway (壬远AI网关) Authors.
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
<template>
  <div class="clusters">
    <Tabs v-model="activeTab" @on-click="onTabChange">
      <TabPane :label="$t('eppPool.title')" name="pool" />
      <TabPane :label="$t('eppAssignment.title')" name="assignment" />
    </Tabs>
    <Pool v-if="activeTab === 'pool'" :key="poolKey" />
    <Assignments v-if="activeTab === 'assignment'" :key="assignmentKey" />
  </div>
</template>
<script>
import Pool from './components/Pool';
import Assignments from './components/Assignments';

export default {
  name: 'EppPool',
  components: { Pool, Assignments },
  data() {
    return {
      activeTab: 'pool',
      poolKey: 0,
      assignmentKey: 0,
    };
  },
  methods: {
    onTabChange(name) {
      if (name === 'pool') {
        this.poolKey += 1;
      } else {
        this.assignmentKey += 1;
      }
    },
  },
};
</script>