<template>
  <div class="rule-view-panel">
    <div class="info-row">
      <span class="info-label">{{ $t('route.ruleName') }}</span>
      <span class="info-value">{{ rule.name || '-' }}</span>
    </div>
    <div class="info-row">
      <span class="info-label">{{ $t('route.expression') }}</span>
      <span class="info-value expression-value">{{ rule.Cond || '-' }}</span>
    </div>
    <div class="info-row">
      <span class="info-label">{{ $t('route.targetClusterAndModel') }}</span>
      <span class="info-value">
        <Tag v-for="(t, index) in rule.targets || []" :key="`target-${index}`">
          {{ t.ClusterName }}/{{ t.Model || '' }}: {{ t.Weight }}%
        </Tag>
        <span v-if="!(rule.targets || []).length">-</span>
      </span>
    </div>
    <div class="info-row">
      <span class="info-label">{{ $t('route.fallbackClusterAndModel') }}</span>
      <span class="info-value">
        <Tag
          v-for="(f, index) in rule.fallbacks || []"
          :key="`fallback-${index}`"
        >
          {{ f.ClusterName }}/{{ f.Model || '' }}
        </Tag>
        <span
          v-if="!(rule.fallbacks || []).length"
          >{{ $t('route.noFallbackCluster') }}</span
        >
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RuleView',

  props: {
    rule: {
      type: Object,
      required: true
    }
  },

  methods: {
    onClose() {
      this.$emit('close');
    }
  }
};
</script>

<style lang="less" scoped>
.rule-view-panel {
  margin-top: 16px;
  padding: 16px;
  background: #f8f8f9;
  border: 1px solid #e8eaec;
  border-radius: 4px;

  .view-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .view-title {
      font-weight: bold;
      font-size: 14px;
    }

    .close-icon {
      cursor: pointer;
      font-size: 18px;
      color: #999;

      &:hover {
        color: #666;
      }
    }
  }

  .info-row {
    display: flex;
    margin-bottom: 10px;
    line-height: 24px;

    .info-label {
      width: 120px;
      flex-shrink: 0;
      color: #515a6e;
      font-weight: 500;
    }

    .info-value {
      flex: 1;
      color: #17233d;

      &.expression-value {
        font-family: monospace;
        word-break: break-all;
      }
    }
  }
}
</style>
