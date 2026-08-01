<!-- eslint-disable -->
<template>
  <div class="route-rules">
    <div class="route-editor-header">
      <div class="route-owner-label">
        {{ $t('route.currentRouteTable') }}：<strong>{{ typeLabel }}</strong> /
        {{ ownerLabel }}
      </div>
      <div class="header-actions">
        <Button
          v-if="mode === 'view'"
          size="small"
          type="primary"
          @click="enterEditMode"
        >
          {{ $t('route.enterEditMode') }}
        </Button>
        <template v-else>
          <Button size="small" @click="exitEditMode">
            {{ $t('route.exitEditMode') }}
          </Button>
          <Button
            size="small"
            type="primary"
            style="margin-left: 8px;"
            :loading="submitting"
            @click="submitRules"
          >
            {{ $t('com.submitAndEffect') }}
          </Button>
        </template>
      </div>
    </div>

    <div class="enable-row">
      <span class="enable-label">{{ $t('route.routeTableEnabled') }}</span>
      <Select
        v-model="enabledValue"
        style="width: 160px;"
        :disabled="mode === 'view'"
        @on-change="onEnabledChange"
      >
        <Option value="true">{{ $t('com.enable') }}</Option>
        <Option value="false">{{ $t('com.deactivate') }}</Option>
      </Select>
    </div>

    <div class="action-bar">
      <Button
        v-show="mode === 'edit'"
        size="small"
        type="primary"
        @click="onAddRule"
      >
        {{ $t('com.createX', { obj: $t('route.rule') }) }}
      </Button>
    </div>

    <pageTable :columns="ruleColumns" :tableData="rules" :loading="loading" />

    <Drawer
      v-model="viewRuleVisible"
      :title="$t('com.seeX', { obj: $t('route.rule') })"
      width="50"
      :mask-closable="true"
      @on-close="viewRule = null"
    >
      <RuleView
        v-if="viewRule"
        :rule="viewRule"
        @close="viewRuleVisible = false"
      />
    </Drawer>

    <Drawer
      v-model="ruleDrawerVisible"
      :title="ruleDrawerTitle"
      width="60"
      :mask-closable="false"
    >
      <RuleForm
        v-if="ruleDrawerVisible"
        :rule="currentRule"
        :clusters="clusters"
        :readonly="mode === 'view'"
        @submit="onRuleFormSubmit"
        @cancel="ruleDrawerVisible = false"
      />
    </Drawer>
  </div>
</template>

<script>
import pageTable from '@/components/table/pageTable';
import RuleForm from './RuleForm.vue';
import RuleView from './RuleView.vue';
import { cloneDeep } from 'lodash';

const TYPE_LABELS = {
  global: 'Global',
  entity: 'Entity',
  api_key: 'API-Key'
};

export default {
  name: 'RouteRules',

  components: {
    pageTable,
    RuleForm,
    RuleView
  },

  props: {
    type: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      default: ''
    },
    initialData: {
      type: Object,
      default: null
    }
  },

  data() {
    const that = this;
    return {
      loading: false,
      submitting: false,
      enabled: false,
      enabledValue: 'false',
      rules: [],
      originalRules: null,
      mode: 'view',
      clusters: [],
      ruleDrawerVisible: false,
      ruleDrawerTitle: '',
      currentRule: null,
      currentRuleIndex: -1,
      viewRule: null,
      viewRuleVisible: false,
      ruleColumns: that.buildRuleColumns()
    };
  },

  computed: {
    typeLabel() {
      return TYPE_LABELS[this.type] || this.type;
    },
    ownerLabel() {
      if (this.type === 'global') return 'Global';
      return this.owner || '-';
    }
  },

  watch: {
    enabled: {
      handler(val) {
        this.enabledValue = val === true ? 'true' : 'false';
      },
      immediate: true
    },
    mode() {
      this.ruleColumns = this.buildRuleColumns();
    }
  },

  methods: {
    buildRuleColumns() {
      const that = this;
      return [
        {
          title: that.$t('route.ruleName'),
          key: 'name',
          searchable: that.mode !== 'view',
          sortable: 'custom',
          render(h, params) {
            return <span>{params.row.name || '-'}</span>;
          }
        },
        {
          title: that.$t('route.expression'),
          key: 'Cond',
          sortable: 'custom',
          searchable: that.mode !== 'view',
          render(h, params) {
            return <span>{params.row.Cond || '-'}</span>;
          }
        },
        {
          title: that.$t('route.targetClusterAndModel'),
          key: 'targets',
          sortable: 'custom',
          searchable: that.mode !== 'view',
          render(h, params) {
            const targets = params.row.targets || [];
            return h('div', targets.map(t =>
              h('Tag', {
                key: `${t.ClusterName}-${t.Model}`
              }, `${t.ClusterName}/${t.Model || ''}: ${t.Weight}%`)
            ));
          }
        },
        {
          title: that.$t('route.fallbackClusterAndModel'),
          key: 'fallbacks',
          searchable: that.mode !== 'view',
          sortable: 'custom',
          render(h, params) {
            const fallbacks = params.row.fallbacks || [];
            return h('div', fallbacks.map((f, index) =>
              h('Tag', {
                key: index
              }, `${f.ClusterName}/${f.Model || ''}`)
            ));
          }
        },
        {
          title: that.$t('com.operation'),
          key: 'operation',
          width: 150,
          render(h, params) {
            const row = params.row;
            if (that.mode === 'view') {
              return h('Button', {
                props: { size: 'small', type: 'primary' },
                on: { click: () => that.onViewRule(row) }
              }, that.$t('com.see'));
            }
            return h('div', [
              h('Button', {
                props: { size: 'small', type: 'primary' },
                style: { marginRight: '8px' },
                on: { click: () => that.onEditRule(row, row.index) }
              }, that.$t('com.edit')),
              h('Button', {
                props: { size: 'small', type: 'error' },
                on: { click: () => that.onDeleteRule(row.index) }
              }, that.$t('com.del'))
            ]);
          }
        }
      ];
    },

    fetchClusters() {
      this.$request({
        url: 'clusters',
        method: 'get',
        openapi: true
      })
        .then(res => {
          if (res.status === 200) {
            const data = res.data.Data || [];
            this.clusters = data.map(cluster => ({
              name: cluster.name,
              models: (cluster.llm_config && cluster.llm_config.models) || []
            }));
          }
        })
        .catch(err => {
          console.error('获取集群列表失败:', err);
        });
    },

    fetchRules() {
      this.loading = true;
      if (this.type === 'global') {
        this.$request({
          url: 'global-route-rules',
          method: 'get',
          openapi: true
        })
          .then(res => {
            if (res.status === 200) {
              const data = res.data.Data || { enabled: false, rules: [] };
              this.enabled = data.enabled === true;
              this.rules = data.rules || [];
              this.refreshRuleIndex();
            }
          })
          .finally(() => {
            this.loading = false;
          });
        return;
      }
      const url = this.type === 'entity' ? `entities/${this.owner}` : `api-keys/${this.owner}`;
      this.$request({
        url: url,
        method: 'get',
        openapi: true
      })
        .then(res => {
          if (res.status === 200) {
            const data = res.data.Data || {};
            const routeRules = data.route_rules || { enabled: false, rules: [] };
            this.enabled = routeRules.enabled === true;
            this.rules = routeRules.rules || [];
            this.refreshRuleIndex();
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    refreshRuleIndex() {
      this.rules = this.rules.map((rule, index) => ({ ...rule, index }));
    },

    enterEditMode() {
      this.mode = 'edit';
      this.originalRules = cloneDeep(this.rules);
    },

    exitEditMode() {
      this.mode = 'view';
      if (this.originalRules) {
        this.rules = this.originalRules;
        this.originalRules = null;
        this.refreshRuleIndex();
      }
      this.fetchRules();
    },

    onAddRule() {
      this.currentRuleIndex = -1;
      this.currentRule = {
        name: '',
        Cond: '',
        targets: [{ ClusterName: '', Model: '', Weight: 100 }],
        fallbacks: []
      };
      this.ruleDrawerTitle = this.$t('com.createX', { obj: this.$t('route.rule') });
      this.ruleDrawerVisible = true;
    },

    onEditRule(rule, index) {
      this.currentRuleIndex = index;
      this.currentRule = cloneDeep(rule);
      this.ruleDrawerTitle = this.$t('com.editX', { obj: this.$t('route.rule') });
      this.ruleDrawerVisible = true;
    },

    onViewRule(rule) {
      this.viewRule = cloneDeep(rule);
      this.viewRuleVisible = true;
    },

    onDeleteRule(index) {
      this.rules.splice(index, 1);
      this.refreshRuleIndex();
    },

    onRuleFormSubmit(rule) {
      if (this.mode === 'view') {
        this.ruleDrawerVisible = false;
        return;
      }
      if (this.currentRuleIndex === -1) {
        this.rules.push(rule);
      } else {
        this.rules.splice(this.currentRuleIndex, 1, rule);
      }
      this.refreshRuleIndex();
      this.ruleDrawerVisible = false;
    },

    submitRules() {
      const ruleNames = (this.rules || []).map(rule => rule.name).filter(Boolean);
      const uniqueNames = [...new Set(ruleNames)];
      if (ruleNames.length !== uniqueNames.length) {
        this.$Message.error(this.$t('route.ruleNameDuplicate'));
        return;
      }

      this.submitting = true;
      const payload = this.buildPayload();
      this.$request({
        url: this.getUpdateUrl(),
        method: this.getUpdateMethod(),
        data: payload,
        openapi: true
      })
        .then(res => {
          if (res.status === 200) {
            this.$Message.success({
              content: this.$t('com.tipSubmitSucc')
            });
            this.originalRules = null;
            this.mode = 'view';
            this.$emit('submit');
          }
        })
        .catch(err => {
          console.error('提交路由规则失败:', err);
          this.$Message.error(this.$t('com.tipSubmitFailed'));
        })
        .finally(() => {
          this.submitting = false;
        });
    },

    buildPayload() {
      const rules = this.rules.map(rule => {
        const clean = cloneDeep(rule);
        delete clean.index;
        delete clean._index;
        delete clean._rowKey;
        return clean;
      });
      if (this.type === 'global') {
        return { enabled: this.enabled, rules };
      }
      return { route_rules: { enabled: this.enabled, rules } };
    },

    getUpdateUrl() {
      if (this.type === 'global') {
        return 'global-route-rules';
      }
      return this.type === 'entity' ? `entities/${this.owner}` : `api-keys/${this.owner}`;
    },

    getUpdateMethod() {
      return this.type === 'global' ? 'put' : 'patch';
    },

    onEnabledChange(val) {
      this.enabled = val === 'true';
    },

    onCancel() {
      this.$emit('close');
    }
  },

  mounted() {
    this.fetchClusters();
    if (this.initialData) {
      this.enabled = this.initialData.enabled === true;
      this.rules = cloneDeep(this.initialData.rules || []);
      this.refreshRuleIndex();
    } else {
      this.fetchRules();
    }
  }
};
</script>

<style lang="less" scoped>
.route-rules {
  .route-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .route-owner-label {
    color: #515a6e;
    font-size: 14px;
  }

  .enable-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .enable-label {
      margin-right: 8px;
    }
  }

  .action-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 16px;
  }

  .submit-bar {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
