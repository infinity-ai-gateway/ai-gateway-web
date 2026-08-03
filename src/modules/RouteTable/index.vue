/**
* Copyright(c) 2026 Beijing Yingfei Networks Technology Co.Ltd. 
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
  <div class="route-table">
    <div v-if="!detailVisible" class="list-view">
      <pageTable :columns="columns" :tableData="tableData" :loading="loading" />
    </div>

    <div v-else class="detail-view">
      <div class="detail-content">
        <RouteRules
          :type="currentType"
          :owner="currentOwner"
          :initialData="currentInitialData"
          @close="backToList"
          @submit="onRulesSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import pageTable from '@/components/table/pageTable';
import RouteRules from './components/RouteRules.vue';

const TYPE_MAP = {
  global: 'Global',
  entity: 'Entity',
  api_key: 'API-Key'
};

export default {
  name: 'RouteTable',

  components: {
    pageTable,
    RouteRules
  },

  data() {
    const that = this;
    return {
      loading: false,
      detailVisible: false,
      currentType: '',
      currentOwner: '',
      currentInitialData: null,
      tableData: [],
      columns: [
        {
          title: that.$t('route.routeTableType'),
          key: 'type',
          searchable: true,
          searchType: 'select',
          sortable: 'custom',
          searchFilters: [
            { label: 'Global', value: 'global' },
            { label: 'Entity', value: 'entity' },
            { label: 'API-Key', value: 'api_key' }
          ],
          render(h, params) {
            return <span>{TYPE_MAP[params.row.type] || params.row.type || '-'}</span>;
          }
        },
        {
          title: that.$t('route.routeTableOwner'),
          key: 'owner',
          searchable: true,
          sortable: 'custom',
          render(h, params) {
            return <span>{params.row.owner || '-'}</span>;
          }
        },
        {
          title: that.$t('com.state'),
          key: 'enabled',
          searchable: true,
          searchType: 'select',
          searchFilters: [
            { label: that.$t('com.enable'), value: 'true' },
            { label: that.$t('com.deactivate'), value: 'false' }
          ],
          sortable: 'custom',
          render(h, params) {
            const enabled = params.row.enabled === true;
            return h('Tag', {
              props: {
                color: enabled ? 'success' : 'default'
              }
            }, enabled ? that.$t('com.enable') : that.$t('com.deactivate'));
          }
        },
        {
          title: that.$t('com.operation'),
          key: 'operation',
          width: 240,
          render(h, params) {
            const row = params.row;
            const enabled = row.enabled === true;
            return h('div', [
              h('Button', {
                props: { size: 'small', type: 'primary' },
                style: { marginRight: '8px' },
                on: { click: () => that.onView(row) }
              }, that.$t('com.see')),
              h('Button', {
                props: { size: 'small', type: 'success', disabled: enabled },
                style: { marginRight: '8px' },
                on: { click: () => that.onToggleEnabled(row, true) }
              }, that.$t('com.enable')),
              h('Button', {
                props: { size: 'small', type: 'warning', disabled: !enabled },
                on: { click: () => that.onToggleEnabled(row, false) }
              }, that.$t('com.deactivate'))
            ]);
          }
        }
      ]
    };
  },

  computed: {
    detailTypeLabel() {
      return TYPE_MAP[this.currentType] || this.currentType || '-';
    },
    detailOwnerLabel() {
      if (this.currentType === 'global') return 'Global';
      return this.currentOwner || '-';
    }
  },

  mounted() {
    this.fetchData();
  },

  beforeDestroy() {
    if (this.detailVisible) {
      this.$store.setBreadcrumbTitle('');
    }
  },

  watch: {
    '$store.state.breadcrumbTitle'(val) {
      if (!val && this.detailVisible) {
        this.backToList();
      }
    }
  },

  methods: {
    fetchData() {
      this.loading = true;
      this.$request({
        url: 'route-tables',
        method: 'get',
        openapi: true
      })
        .then(res => {
          if (res.status === 200) {
            const data = res.data.Data || {};
            const list = Array.isArray(data.list) ? data.list : [];
            this.tableData = list;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onView(row) {
      this.currentType = row.type;
      this.currentOwner = row.type === 'global' ? '' : row.owner;
      this.currentInitialData = null;
      this.detailVisible = true;
      this.updateBreadcrumb();
    },

    backToList() {
      this.detailVisible = false;
      this.currentType = '';
      this.currentOwner = '';
      this.currentInitialData = null;
      this.$store.setBreadcrumbTitle('');
    },

    updateBreadcrumb() {
      const title = `${this.$t('route.routeRule')} - ${this.detailTypeLabel} / ${this.detailOwnerLabel}`;
      this.$store.setBreadcrumbTitle(title, 'AdvanceRouteRule.list');
    },

    onRulesSubmit() {
      this.fetchData();
    },

    onToggleEnabled(row, newEnabled) {
      this.loading = true;
      this.fetchFullRules(row)
        .then(fullRules => {
          const payload = this.buildTogglePayload(row.type, newEnabled, fullRules);
          return this.$request({
            url: this.getToggleUrl(row.type, row.owner),
            method: this.getToggleMethod(row.type),
            data: payload,
            openapi: true
          });
        })
        .then(res => {
          if (res.status === 200) {
            this.$Message.success({
              content: newEnabled ? this.$t('route.routeTableEnabled') : this.$t('route.routeTableDisabled')
            });
            this.fetchData();
          }
        })
        .catch(err => {
          console.error('切换路由表状态失败:', err);
          this.$Message.error(this.$t('route.toggleStatusFailed'));
        })
        .finally(() => {
          this.loading = false;
        });
    },

    fetchFullRules(row) {
      if (row.type === 'global') {
        return this.$request({
          url: 'global-route-rules',
          method: 'get',
          openapi: true
        }).then(res => {
          if (res.status === 200) {
            return res.data.Data || { enabled: false, rules: [] };
          }
          return { enabled: false, rules: [] };
        });
      }
      const url = row.type === 'entity' ? `entities/${row.owner}` : `api-keys/${row.owner}`;
      return this.$request({
        url: url,
        method: 'get',
        openapi: true
      }).then(res => {
        if (res.status === 200) {
          const data = res.data.Data || {};
          return data.route_rules || { enabled: false, rules: [] };
        }
        return { enabled: false, rules: [] };
      });
    },

    buildTogglePayload(type, newEnabled, fullRules) {
      const rules = fullRules.rules || [];
      if (type === 'global') {
        return { enabled: newEnabled, rules };
      }
      return { route_rules: { enabled: newEnabled, rules } };
    },

    getToggleUrl(type, owner) {
      if (type === 'global') {
        return 'global-route-rules';
      }
      return type === 'entity' ? `entities/${owner}` : `api-keys/${owner}`;
    },

    getToggleMethod(type) {
      return type === 'global' ? 'put' : 'patch';
    }
  }
};
</script>

<style lang="less" scoped>
.route-table {
  .detail-view {
    .detail-content {
      padding: 16px;
      background: #fff;
      border-radius: 4px;
      min-height: 400px;

      .detail-header {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
