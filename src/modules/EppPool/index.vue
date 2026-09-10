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