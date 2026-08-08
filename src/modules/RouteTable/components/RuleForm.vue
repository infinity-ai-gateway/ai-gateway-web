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
<template>
  <div class="rule-form">
    <Form
      ref="formData"
      :model="formData"
      :rules="ruleValidate"
      label-position="top"
    >
      <FormItem :label="$t('route.ruleName')" prop="name">
        <Input
          v-model="formData.name"
          :disabled="readonly"
          :placeholder="$t('route.ruleNamePlaceholder')"
        />
      </FormItem>

      <FormItem :label="$t('route.expression')" prop="Cond">
        <Expression
          :expression="formData.Cond"
          :readonly="readonly"
          @expressionChanged="onExpressionChanged"
        />
      </FormItem>

      <div class="section-title required">
        <span class="required-mark">*</span>
        {{ $t('route.targetClusterAndModel') }}
      </div>
      <div
        v-for="(target, index) in formData.targets"
        :key="`target-${index}`"
        class="dynamic-row target-row"
      >
        <Row :gutter="8" type="flex" align="middle">
          <Col span="2" class="field-label">{{ $t('route.cluster') }}</Col>
          <Col span="5">
            <FormItem
              :prop="`targets.${index}.ClusterName`"
              :rules="targetClusterRules"
              class="inline-form-item"
            >
              <Select
                v-model="target.ClusterName"
                :disabled="readonly"
                :placeholder="$t('route.selectTargetCluster')"
                filterable
                @on-change="onTargetClusterChange(index)"
              >
                <Option
                  v-for="cluster in getClusters(index, 'target')"
                  :key="cluster.name"
                  :value="cluster.name"
                  :label="cluster.name"
                />
              </Select>
            </FormItem>
          </Col>
          <Col span="2" class="field-label">{{ $t('route.model') }}</Col>
          <Col span="9">
            <Select
              v-model="target.Model"
              :disabled="readonly"
              :placeholder="$t('route.modelTransparent')"
              filterable
              allow-create
              clearable
            >
              <Option
                v-for="model in getModelsByCluster(target.ClusterName, index, 'target')"
                :key="model"
                :value="model"
                :label="model"
              />
            </Select>
          </Col>
          <Col span="2" class="field-label">{{ $t('route.weight') }}</Col>
          <Col span="2">
            <FormItem
              :prop="`targets.${index}.Weight`"
              :rules="targetWeightRules"
              class="inline-form-item"
            >
              <InputNumber
                v-model="target.Weight"
                :disabled="readonly"
                :min="0"
                :max="100"
                :placeholder="$t('route.weight')"
                style="width: 100%;"
              />
            </FormItem>
          </Col>
          <Col span="2" class="delete-col">
            <Button
              v-if="!readonly && formData.targets.length > 1"
              class="delete-btn"
              size="small"
              @click="removeTarget(index)"
            >
              {{ $t('com.del') }}
            </Button>
          </Col>
        </Row>
      </div>
      <div v-if="!readonly" class="add-btn-row">
        <Button size="small" class="add-btn" @click="addTarget">
          + {{ $t('route.addTarget') }}
        </Button>
      </div>
      <p v-if="!readonly && weightError" class="weight-error">
        {{ $t('route.weightSumError') }}
      </p>

      <FormItem class="com-btn-box drawer-footer">
        <Button
          v-if="!readonly"
          type="primary"
          size="small"
          @click="handleSubmit"
        >
          {{ $t('com.localSave') }}
        </Button>
        <Button size="small" style="margin-left: 8px;" @click="handleReset">
          {{ $t('com.reset') }}
        </Button>
      </FormItem>
    </Form>
  </div>
</template>

<script>
import Expression from '@/components/Expression';
import { cloneDeep } from 'lodash';

const defaultTarget = { ClusterName: '', Model: '', Weight: 0 };

export default {
  name: 'RuleForm',

  components: { Expression },

  props: {
    rule: {
      type: Object,
      required: true
    },
    clusters: {
      type: Array,
      default() {
        return [];
      }
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },

  data() {
    const validateCond = (rule, value, callback) => {
      if (this.formData.condErrmsg) {
        callback(new Error(this.formData.condErrmsg));
        return;
      }
      if (!value) {
        callback(new Error(this.$t('com.tipNotEmptyX', { obj: this.$t('route.expression') })));
        return;
      }
      callback();
    };

    return {
      formData: {
        ...cloneDeep(this.rule),
        condErrmsg: ''
      },
      weightError: false,
      modelServices: [],
      targetClusterRules: [
        {
          required: true,
          message: this.$t('com.tipNotEmptyX', { obj: this.$t('route.cluster') }),
          trigger: 'change'
        }
      ],
      targetWeightRules: [
        {
          validator: (rule, value, callback) => {
            if (value === '' || value === null || value === undefined) {
              callback(new Error(this.$t('com.tipNotEmptyX', { obj: this.$t('route.weight') })));
              return;
            }
            const num = Number(value);
            if (Number.isNaN(num) || num < 0 || num > 100) {
              callback(new Error(this.$t('route.weightRangeError')));
              return;
            }
            callback();
          },
          trigger: 'change'
        }
      ],
      ruleValidate: {
        name: [
          {
            required: true,
            message: this.$t('com.tipNotEmptyX', { obj: this.$t('route.ruleName') }),
            trigger: 'blur'
          },
          {
            min: 1,
            max: 64,
            message: this.$t('route.ruleNameLengthError') || '规则名称长度为 1–64 个字符',
            trigger: 'blur'
          },
          {
            pattern: /^[a-zA-Z0-9]([a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/,
            message: this.$t('route.ruleNameFormatError') || '规则名称仅允许字母、数字、-、_、.，且不允许以 -、_、. 开头或结尾',
            trigger: 'blur'
          }
        ],
        Cond: [
          {
            required: true,
            validator: validateCond,
            trigger: 'change'
          }
        ]
      }
    };
  },

  watch: {
    rule: {
      handler(newVal) {
        this.formData = {
          ...cloneDeep(newVal),
          condErrmsg: ''
        };
      },
      deep: true,
      immediate: true
    }
  },

  mounted() {
    this.fetchModelServices();
  },

  methods: {
    onExpressionChanged(data) {
      this.formData.Cond = data.expression;
      this.formData.condErrmsg = data.errmsg || '';
      this.$refs.formData.validateField('Cond');
    },

    addTarget() {
      this.formData.targets.push(cloneDeep(defaultTarget));
    },

    removeTarget(index) {
      this.formData.targets.splice(index, 1);
    },

    validateWeight() {
      const sum = (this.formData.targets || []).reduce((acc, t) => acc + (Number(t.Weight) || 0), 0);
      this.weightError = sum !== 100;
      return !this.weightError;
    },

    validateDuplicate() {
      const targets = this.formData.targets || [];
      const targetKeys = targets.map(t => `${t.ClusterName || ''}|${t.Model || ''}`);
      const targetDup = targetKeys.find((key, idx) => targetKeys.indexOf(key) !== idx);
      if (targetDup) {
        this.$Message.error(this.$t('route.targetDuplicate'));
        return false;
      }
      return true;
    },

    getClusters(/* currentIndex, type */) {
      // Allow selecting the same cluster for multiple targets as long as (ClusterName, Model) is unique
      return this.clusters || [];
    },

    getModelsByCluster(clusterName) {
      if (!clusterName) return [];
      const service = (this.modelServices || []).find(s => s.cluster_name === clusterName);
      return service && service.models ? service.models : [];
    },

    fetchModelServices() {
      this.$request({
        url: 'clusters',
        method: 'get',
        openapi: true
      }).then(data => {
        if (data.status === 200) {
          const clusters = data.data.Data || [];
          this.modelServices = clusters
            .filter(cluster => cluster.llm_config && cluster.llm_config.models && cluster.llm_config.models.length > 0)
            .map(cluster => ({
              cluster_name: cluster.name,
              models: cluster.llm_config.models
            }));
        }
      }).catch(() => {
        this.modelServices = [];
      });
    },

    onTargetClusterChange(index) {
      const target = this.formData.targets[index];
      if (target) {
        target.Model = '';
      }
    },

    handleSubmit() {
      this.$refs.formData.validate(valid => {
        if (!valid) {
          this.$Message.error(this.$t('com.tipValidateError'));
          return;
        }
        if (!this.validateWeight()) {
          this.$Message.error(this.$t('route.weightSumError'));
          return;
        }
        if (!this.validateDuplicate()) {
          return;
        }
        if (!this.formData.targets || this.formData.targets.length === 0) {
          this.$Message.error(this.$t('route.targetAtLeastOne'));
          return;
        }
        const result = cloneDeep(this.formData);
        delete result.condErrmsg;
        delete result.fallbacks;
        this.$emit('submit', result);
      });
    },

    handleReset() {
      this.$refs.formData.resetFields();
      this.formData = {
        ...cloneDeep(this.rule),
        condErrmsg: ''
      };
    }
  }
};
</script>

<style lang="less" scoped>
.rule-form {
  .section-title {
    font-weight: bold;
    margin-bottom: 8px;

    &.required {
      .required-mark {
        color: #ed4014;
        margin-right: 4px;
      }
    }
  }

  .dynamic-row {
    margin-bottom: 24px;
  }

  .inline-form-item {
    margin-bottom: 0;
  }

  .target-row {
    .field-label {
      text-align: right;
      line-height: 32px;
      padding-right: 4px;
      white-space: nowrap;
    }

    .delete-col {
      text-align: right;

      .delete-btn {
        background-color: #ffccc7;
        border-color: #ffccc7;
        color: #a8071a;

        &:hover {
          background-color: #ffa39e;
          border-color: #ffa39e;
        }
      }
    }
  }

  .add-btn-row {
    margin-top: 18px;
    margin-bottom: 8px;
    padding-left: calc(2 / 24 * 100% + 4px);

    .add-btn {
      background: #fff;
      border: 1px solid #dcdee2;
      color: #515a6e;
    }
  }

  .weight-error {
    color: #ed4014;
    margin-top: 8px;
  }

  .footer-divider {
    border-top: 1px solid #e8eaec;
    margin-top: 24px;
    margin-bottom: 16px;
  }

  .footer-bar {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
