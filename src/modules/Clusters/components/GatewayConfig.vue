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
  <div>
    <Form
      label-position="top"
      ref="formData"
      :model="formData"
      :rules="ruleValidate"
      @submit.native.prevent
    >
      <Card
        :title="$t('gatewayConfig.modelServiceConfig')"
        class="llm-section-card"
      >
        <FormItem prop="provider">
          <span slot="label" class="provider-label">
            {{ $t('gatewayConfig.ownedProvider') }}
            <Tooltip placement="top" transfer max-width="320">
              <div slot="content" class="provider-tip-content">
                {{ $t('gatewayConfig.ownedProviderTip') }}
              </div>
              <Icon type="ios-help-circle-outline" class="provider-help-icon" />
            </Tooltip>
          </span>
          <el-select
            v-model="formData.provider"
            filterable
            size="small"
            :loading="providerNamesLoading"
            @change="onProviderChange"
          >
            <el-option
              v-for="item in providerNames"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </FormItem>
        <FormItem prop="models">
          <span slot="label" class="provider-label">
            {{ $t('gatewayConfig.forwardModels') }}
            <Tooltip placement="top" transfer max-width="320">
              <div slot="content" class="provider-tip-content">
                {{ $t('gatewayConfig.forwardModelsTip') }}
              </div>
              <Icon type="ios-help-circle-outline" class="provider-help-icon" />
            </Tooltip>
          </span>
          <el-select
            v-model="formData.models"
            style="width: 100%;"
            size="small"
            multiple
            clearable
            filterable
            :disabled="!formData.provider || providerDetailLoading"
            @change="onForwardModelsChange"
          >
            <el-option
              v-if="providerModels.length && !allModelsSelected"
              key="__select_all_models__"
              class="forward-models-select-all"
              :label="$t('gatewayConfig.selectAll')"
              :value="selectAllModelsMarker"
            />
            <el-option
              v-for="item in providerModels"
              :key="item"
              :value="item"
              :label="item"
            />
          </el-select>
        </FormItem>
        <FormItem prop="strip_prefix">
          <span slot="label" class="provider-label">
            {{ $t('gatewayConfig.stripPrefix') }}
            <Tooltip placement="top" transfer max-width="320">
              <div slot="content" class="provider-tip-content">
                {{ $t('gatewayConfig.stripPrefixTip') }}
              </div>
              <Icon type="ios-help-circle-outline" class="provider-help-icon" />
            </Tooltip>
          </span>
          <i-switch v-model="formData.strip_prefix" />
        </FormItem>
        <FormItem v-if="formData.strip_prefix" prop="match_prefix">
          <span slot="label" class="provider-label">
            {{ $t('gatewayConfig.matchPrefix') }}
            <Tooltip placement="top" transfer max-width="320">
              <div slot="content" class="provider-tip-content">
                {{ $t('gatewayConfig.matchPrefixTip') }}
              </div>
              <Icon type="ios-help-circle-outline" class="provider-help-icon" />
            </Tooltip>
          </span>
          <Input
            v-model="formData.match_prefix"
            :placeholder="$t('gatewayConfig.matchPrefixPlaceholder')"
          />
        </FormItem>
      </Card>

      <Card :title="$t('gatewayConfig.modelRedirect')" class="llm-section-card">
        <FormItem prop="model_mappings">
          <table>
            <thead>
              <tr>
                <th>{{ $t('gatewayConfig.originalModelName') }}</th>
                <th>{{ $t('gatewayConfig.backendModelName') }}</th>
                <th>{{ $t('com.operation') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(model, index) in formData.model_mappings"
                :key="index"
              >
                <td>
                  <Input
                    :value="model.source_model"
                    @on-change="e => changeMappingSource(index, e.target.value)"
                    :placeholder="$t('gatewayConfig.enterOriginalModelName')"
                  />
                </td>
                <td>
                  <Select
                    v-model="model.target_model"
                    :placeholder="$t('gatewayConfig.selectTargetModel')"
                    @on-change="value => changeMappingTarget(index, value)"
                  >
                    <Option
                      v-for="(item, idx) in formData.models"
                      :value="item"
                      :key="idx"
                    >{{ item }}</Option>
                  </Select>
                </td>
                <td>
                  <Button type="error" size="small" @click="removeModelMapping(index)">
                    {{ $t('com.del') }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
          <Button class="mt20" size="small" type="primary" @click="addModelRedirect">
            {{ $t('gatewayConfig.add') }}
          </Button>
        </FormItem>
      </Card>

      <Card :title="$t('gatewayConfig.serviceAuthKeys')" class="llm-section-card">
        <FormItem prop="keys">
          <table class="keys-table">
            <thead>
              <tr>
                <th>{{ $t('gatewayConfig.providerKey') }}</th>
                <th style="width: 120px;">{{ $t('gatewayConfig.keyWeight') }}</th>
                <th style="width: 80px;">{{ $t('com.operation') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(keyItem, index) in formData.keys" :key="`key-${index}`">
                <td>
                  <FormItem
                    :prop="`keys.${index}.name`"
                    :rules="keyNameRules(index)"
                    class="inline-form-item"
                  >
                    <Select
                      v-model="keyItem.name"
                      :placeholder="$t('gatewayConfig.providerKeyPlaceholder')"
                      :disabled="!formData.provider || providerDetailLoading"
                      @on-change="validateKeysState"
                    >
                      <Option
                        v-for="item in providerKeys"
                        :key="item.name"
                        :value="item.name"
                      >{{ item.name }}</Option>
                    </Select>
                  </FormItem>
                </td>
                <td>
                  <FormItem
                    :prop="`keys.${index}.weight`"
                    :rules="keyWeightRules(index)"
                    class="inline-form-item"
                  >
                    <InputNumber
                      v-model="keyItem.weight"
                      :min="0"
                      :max="100"
                      :precision="0"
                      style="width: 100%;"
                      @on-change="validateKeysState"
                    />
                  </FormItem>
                </td>
                <td>
                  <Button type="error" size="small" @click="removeKey(index)">
                    {{ $t('com.del') }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
          <Button class="mt20" size="small" type="primary" @click="addKey">
            + {{ $t('gatewayConfig.addKey') }}
          </Button>
        </FormItem>
      </Card>

      <Card :title="$t('gatewayConfig.keyPolicy')" class="llm-section-card">
        <Row :gutter="24">
          <Col span="12">
            <FormItem
              :label="$t('gatewayConfig.keyPolicyStrategy')"
              prop="key_policy.strategy"
            >
              <Select v-model="formData.key_policy.strategy">
                <Option value="weighted_random">weighted_random</Option>
              </Select>
            </FormItem>
          </Col>
          <Col span="12">
            <FormItem
              :label="$t('gatewayConfig.keyPolicyMaxRetries')"
              prop="key_policy.max_retries"
            >
              <InputNumber
                v-model="formData.key_policy.max_retries"
                :min="0"
                :precision="0"
                style="width: 100%;"
              />
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="24">
          <Col span="12">
            <FormItem
              :label="$t('gatewayConfig.keyPolicyRetryBackoffInitial')"
              prop="key_policy.retry_backoff_initial"
            >
              <InputNumber
                v-model="formData.key_policy.retry_backoff_initial"
                :min="0"
                :precision="0"
                style="width: 100%;"
              />
            </FormItem>
          </Col>
          <Col span="12">
            <FormItem
              :label="$t('gatewayConfig.keyPolicyRetryBackoffMax')"
              prop="key_policy.retry_backoff_max"
            >
              <InputNumber
                v-model="formData.key_policy.retry_backoff_max"
                :min="0"
                :precision="0"
                style="width: 100%;"
              />
            </FormItem>
          </Col>
        </Row>
      </Card>
    </Form>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash';

const SELECT_ALL_MODELS_VALUE = '__SELECT_ALL_MODELS__';

function defaultKeyPolicy() {
    return {
        strategy: 'weighted_random',
        max_retries: 0,
        retry_backoff_initial: 500,
        retry_backoff_max: 5000
    };
}

export default {
    name: 'GatewayConfig',

    props: {
        reportFlag: {
            type: Boolean,
            default: false
        },
        llmConfigData: {
            type: Object,
            default() {
                return {};
            }
        },
        isAdd: {
            type: Boolean,
            default: false
        },
        stepsCurrentState: {
            type: Number,
            default: 0
        }
    },

    data() {
        const that = this;
        const validateProvider = (rule, value, callback) => {
            if (!value) {
                callback(new Error(that.$t('gatewayConfig.ownedProviderRequired')));
                return;
            }
            callback();
        };
        const validateModels = (rule, value, callback) => {
            if (!value || !value.length) {
                callback(new Error(that.$t('gatewayConfig.modelsRequired')));
                return;
            }
            const allowed = that.providerModels;
            const invalid = value.find(item => allowed.indexOf(item) === -1);
            if (invalid) {
                callback(new Error(that.$t('gatewayConfig.modelNotInProvider', { model: invalid })));
                return;
            }
            callback();
        };
        const validateMatchPrefix = (rule, value, callback) => {
            if (!that.formData.strip_prefix) {
                callback();
                return;
            }
            if (!value || !String(value).trim()) {
                callback(new Error(that.$t('gatewayConfig.matchPrefixRequiredWhenStrip')));
                return;
            }
            if (!String(value).endsWith('/')) {
                callback(new Error(that.$t('gatewayConfig.matchPrefixMustEndWithSlash')));
                return;
            }
            callback();
        };
        const validateMappings = (rule, value, callback) => {
            const mappings = value || [];
            const sources = {};
            for (let i = 0; i < mappings.length; i++) {
                const source = String(mappings[i].source_model || '').trim();
                const target = String(mappings[i].target_model || '').trim();
                if (!source && !target) {
                    continue;
                }
                if (!source) {
                    callback(new Error(that.$t('gatewayConfig.modelMappingKeyRequired', { line: i + 1 })));
                    return;
                }
                if (!target) {
                    callback(new Error(that.$t('gatewayConfig.modelMappingValueRequired', { line: i + 1 })));
                    return;
                }
                if (sources[source]) {
                    callback(new Error(that.$t('gatewayConfig.duplicateModelName')));
                    return;
                }
                sources[source] = true;
            }
            callback();
        };
        const validateKeys = (rule, value, callback) => {
            const keys = (value || []).filter(item => String(item.name || '').trim());
            if (!keys.length) {
                callback();
                return;
            }
            const names = {};
            const providerKeyNames = that.providerKeys.map(item => item.name);
            let sum = 0;
            for (let i = 0; i < keys.length; i++) {
                const name = String(keys[i].name || '').trim();
                const weight = Number(keys[i].weight);
                if (providerKeyNames.indexOf(name) === -1) {
                    callback(new Error(that.$t('gatewayConfig.keyNotInProvider', { name })));
                    return;
                }
                if (names[name]) {
                    callback(new Error(that.$t('gatewayConfig.keyNameDuplicate')));
                    return;
                }
                names[name] = true;
                if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
                    callback(new Error(that.$t('gatewayConfig.keyWeightRangeError')));
                    return;
                }
                sum += weight;
            }
            if (sum !== 100) {
                callback(new Error(that.$t('gatewayConfig.keysWeightSumError')));
                return;
            }
            callback();
        };
        const validateBackoffMax = (rule, value, callback) => {
            const initial = Number(that.formData.key_policy.retry_backoff_initial);
            const max = Number(value);
            if (Number.isFinite(initial) && Number.isFinite(max) && max < initial) {
                callback(new Error(that.$t('gatewayConfig.keyPolicyBackoffMaxInvalid')));
                return;
            }
            callback();
        };

        return {
            selectAllModelsMarker: SELECT_ALL_MODELS_VALUE,
            providerNames: [],
            providerNamesLoading: false,
            providerDetailLoading: false,
            selectedProvider: null,
            formData: {
                provider: '',
                match_prefix: '',
                strip_prefix: false,
                models: [],
                model_mappings: [{ source_model: '', target_model: '' }],
                keys: [{ name: '', weight: 0 }],
                key_policy: defaultKeyPolicy()
            },
            ruleValidate: {
                provider: [{ validator: validateProvider, trigger: 'change', required: true }],
                models: [{ validator: validateModels, trigger: 'change', required: true }],
                match_prefix: [{ validator: validateMatchPrefix, trigger: 'blur' }],
                model_mappings: [{ validator: validateMappings, trigger: 'change' }],
                keys: [{ validator: validateKeys, trigger: 'change' }],
                'key_policy.retry_backoff_max': [{ validator: validateBackoffMax, trigger: 'change' }]
            }
        };
    },

    computed: {
        providerModels() {
            return (this.selectedProvider && this.selectedProvider.models) || [];
        },
        providerKeys() {
            return (this.selectedProvider && this.selectedProvider.keys) || [];
        },
        allModelsSelected() {
            const all = this.providerModels;
            if (!all.length) {
                return false;
            }
            const selected = this.formData.models || [];
            return all.every(model => selected.includes(model));
        }
    },

    watch: {
        reportFlag() {
            this.handleSubmit();
        },
        llmConfigData: {
            handler(val) {
                this.applyLlmConfig(val);
            },
            immediate: true,
            deep: true
        },
        'formData.strip_prefix'(val) {
            if (!val) {
                this.formData.match_prefix = '';
            }
        }
    },

    mounted() {
        this.fetchProviderNames();
    },

    methods: {
        onForwardModelsChange(value) {
            const selected = value || [];
            const marker = this.selectAllModelsMarker;
            if (!selected.includes(marker)) {
                this.formData.models = selected;
                return;
            }
            this.formData.models = this.providerModels.slice();
        },
        fetchProviderNames() {
            this.providerNamesLoading = true;
            this.$request({
                url: 'providers/actions/get-provider-names',
                method: 'get',
                openapi: true
            })
                .then(res => {
                    if (res.status === 200) {
                        this.providerNames = (res.data.Data && res.data.Data.names) || [];
                        if (this.formData.provider) {
                            this.loadProviderDetail(this.formData.provider);
                        }
                    }
                })
                .finally(() => {
                    this.providerNamesLoading = false;
                });
        },
        loadProviderDetail(name) {
            if (!name) {
                this.selectedProvider = null;
                return Promise.resolve();
            }
            this.providerDetailLoading = true;
            return this.$request({
                url: this.$urlFormat('providers/{provider_name}', {
                    provider_name: name
                }),
                method: 'get',
                openapi: true
            })
                .then(res => {
                    if (this.formData.provider !== name) {
                        return;
                    }
                    if (res.status === 200 && res.data.Data) {
                        this.selectedProvider = res.data.Data;
                        this.syncFormWithProvider();
                    } else {
                        this.selectedProvider = null;
                    }
                })
                .catch(() => {
                    if (this.formData.provider === name) {
                        this.selectedProvider = null;
                    }
                })
                .finally(() => {
                    if (this.formData.provider === name) {
                        this.providerDetailLoading = false;
                    }
                });
        },
        applyLlmConfig(val) {
            const src = val || {};
            this.formData.provider = src.provider || '';
            this.formData.match_prefix = src.match_prefix || '';
            this.formData.strip_prefix = !!src.strip_prefix;
            this.formData.models = (src.models || []).slice();
            this.formData.model_mappings =
                src.model_mappings && src.model_mappings.length
                    ? cloneDeep(src.model_mappings)
                    : [{ source_model: '', target_model: '' }];
            this.formData.keys =
                src.keys && src.keys.length
                    ? src.keys.map(item => ({
                        name: item.name || '',
                        weight: item.weight != null ? Number(item.weight) : 0
                    }))
                    : [{ name: '', weight: 0 }];
            this.formData.key_policy = {
                ...defaultKeyPolicy(),
                ...(src.key_policy || {})
            };
            if (this.formData.provider) {
                this.loadProviderDetail(this.formData.provider);
            } else {
                this.selectedProvider = null;
            }
        },
        syncFormWithProvider() {
            const allowedModels = this.providerModels;
            this.formData.models = (this.formData.models || []).filter(
                item => allowedModels.indexOf(item) !== -1
            );
            const allowedKeys = this.providerKeys.map(item => item.name);
            this.formData.keys = (this.formData.keys || []).map(item => ({
                ...item,
                name: allowedKeys.indexOf(item.name) !== -1 ? item.name : ''
            }));
            if (!this.formData.keys.length) {
                this.formData.keys = [{ name: '', weight: 0 }];
            }
            this.validateKeysState();
        },
        onProviderChange(name) {
            if (!name) {
                this.selectedProvider = null;
                this.formData.models = [];
                this.formData.keys = [{ name: '', weight: 0 }];
                this.validateKeysState();
                return;
            }
            this.loadProviderDetail(name);
        },
        changeMappingSource(index, value) {
            this.formData.model_mappings[index].source_model = value;
        },
        changeMappingTarget(index, value) {
            this.formData.model_mappings[index].target_model = value;
        },
        addModelRedirect() {
            this.formData.model_mappings.push({ source_model: '', target_model: '' });
        },
        removeModelMapping(index) {
            this.formData.model_mappings.splice(index, 1);
            if (!this.formData.model_mappings.length) {
                this.formData.model_mappings.push({ source_model: '', target_model: '' });
            }
        },
        addKey() {
            this.formData.keys.push({ name: '', weight: 0 });
            this.$nextTick(() => {
                this.validateKeysState();
            });
        },
        removeKey(index) {
            this.formData.keys.splice(index, 1);
            if (!this.formData.keys.length) {
                this.formData.keys.push({ name: '', weight: 0 });
            }
            this.validateKeysState();
        },
        keyNameRules(index) {
            const item = this.formData.keys[index] || {};
            if (!String(item.name || '').trim()) {
                return [];
            }
            return [
                {
                    required: true,
                    message: this.$t('gatewayConfig.keyNameRequired'),
                    trigger: 'change'
                }
            ];
        },
        keyWeightRules(index) {
            const item = this.formData.keys[index] || {};
            if (!String(item.name || '').trim()) {
                return [];
            }
            return [
                {
                    type: 'number',
                    min: 0,
                    max: 100,
                    message: this.$t('gatewayConfig.keyWeightRangeError'),
                    trigger: 'change'
                }
            ];
        },
        validateKeysState() {
            if (this.$refs.formData) {
                this.$refs.formData.validateField('keys');
            }
        },
        handleSubmit() {
            this.validateKeysState();
            this.$refs.formData.validate(valid => {
                if (!valid) {
                    this.$Message.error(this.$t('com.tipValidateError'));
                    return;
                }
                const tmpData = cloneDeep(this.formData);
                tmpData.model_mappings = (tmpData.model_mappings || []).filter(
                    item => item.source_model || item.target_model
                );
                tmpData.keys = (tmpData.keys || [])
                    .map(item => ({
                        name: String(item.name || '').trim(),
                        weight: Number(item.weight) || 0
                    }))
                    .filter(item => item.name);
                if (!tmpData.strip_prefix) {
                    delete tmpData.match_prefix;
                    delete tmpData.strip_prefix;
                }
                this.$emit('submitData', {
                    topic: 'llmConfigData',
                    data: tmpData
                });
            });
        }
    }
};
</script>

<style lang="less" scoped>
table {
    width: 100%;
    margin-top: 15px;
    font-size: 14px;
    @border-style: 1px solid #e7e9f0;
    border-top: @border-style;
    border-left: @border-style;
    border-collapse: collapse;

    td,
    th {
        border-bottom: @border-style;
        border-right: @border-style;
        padding: 10px 20px;
        text-align: left;
        word-wrap: break-word;
        word-break: break-all;
        min-width: 130px;
    }

    th {
        background-color: #f8f8f9;
        font-size: 13px;
    }
}

.keys-table {
    width: 100%;
    margin-top: 15px;
    font-size: 14px;
    border-top: 1px solid #e7e9f0;
    border-left: 1px solid #e7e9f0;
    border-collapse: collapse;

    td,
    th {
        border-bottom: 1px solid #e7e9f0;
        border-right: 1px solid #e7e9f0;
        padding: 10px;
        text-align: left;
    }

    th {
        background-color: #f8f8f9;
        font-size: 13px;
    }
}

.forward-models-select-all {
    font-weight: 500;
    color: #2d8cf0;
}

.inline-form-item {
    margin-bottom: 0;
}

.llm-section-card {
    margin-bottom: 16px;

    /deep/ .ivu-card-head p {
        font-size: 13px;
    }
}

.provider-label {
    display: inline-flex;
    align-items: center;
}

.provider-help-icon {
    margin-left: 4px;
    font-size: 16px;
    color: #2d8cf0;
    vertical-align: middle;
}

.provider-tip-content {
    max-width: 320px;
    white-space: normal;
    line-height: 1.5;
}

.mt20 {
    margin-top: 20px;
}
</style>
