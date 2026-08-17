/** * Copyright(c) 2026 Beijing Yingfei Networks Technology Co.Ltd. * * Licensed
under the Apache License, Version 2.0 (the "License"); * you may not use this
file except in compliance with the License. * You may obtain a copy of the
License at * * http: //www.apache.org/licenses/LICENSE-2.0 * * Unless required
by applicable law or agreed to in writing, software * distributed under the
License is distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS
OF ANY KIND, either express or implied. * See the License for the specific
language governing permissions and * limitations under the License. */
<template>
  <div>
    <Form
      label-position="top"
      ref="formData"
      :model="formData"
      :rules="ruleValidate"
      @submit.native.prevent
    >
      <div>
        <Card
          :title="$t('gatewayConfig.modelServiceConfig')"
          class="llm-section-card"
        >
          <FormItem prop="provider_type">
            <span slot="label" class="provider-label">
              {{ $t('gatewayConfig.modelServiceProvider') }}
              <Tooltip placement="top" transfer max-width="320">
                <div slot="content" class="provider-tip-content">
                  {{ $t('gatewayConfig.providerTypeTip') }}
                </div>
                <Icon
                  type="ios-help-circle-outline"
                  class="provider-help-icon"
                />
              </Tooltip>
            </span>
            <Select v-model="formData.provider_type">
              <Option v-for="item in providers" :value="item.id" :key="item.id">
                {{ item.name }}
              </Option>
            </Select>
          </FormItem>
          <FormItem prop="provider">
            <span slot="label" class="provider-label">
              {{ $t('gatewayConfig.provider') }}
              <Tooltip placement="top" transfer max-width="320">
                <div slot="content" class="provider-tip-content">
                  {{ $t('gatewayConfig.providerTip') }}
                </div>
                <Icon
                  type="ios-help-circle-outline"
                  class="provider-help-icon"
                />
              </Tooltip>
            </span>
            <Input v-model="formData.provider" />
          </FormItem>
          <FormItem prop="strip_prefix">
            <span slot="label" class="provider-label">
              {{ $t('gatewayConfig.stripPrefix') }}
              <Tooltip placement="top" transfer max-width="320">
                <div slot="content" class="provider-tip-content">
                  {{ $t('gatewayConfig.stripPrefixTip') }}
                </div>
                <Icon
                  type="ios-help-circle-outline"
                  class="provider-help-icon"
                />
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
                <Icon
                  type="ios-help-circle-outline"
                  class="provider-help-icon"
                />
              </Tooltip>
            </span>
            <Input
              v-model="formData.match_prefix"
              :placeholder="$t('gatewayConfig.matchPrefixPlaceholder')"
            />
          </FormItem>
          <FormItem
            :label="$t('gatewayConfig.modelListEndpoint')"
            prop="model_endpoint"
          >
            <div class="endpoint-url-group">
              <Select
                class="endpoint-protocol"
                v-model="formData.model_endpoint.schema"
              >
                <Option value="http">http://</Option>
                <Option value="https">https://</Option>
              </Select>
              <span
                class="endpoint-host"
                :title="endpointHostDisplay"
                >{{ endpointHostDisplay }}</span
              >
              <Input
                class="endpoint-uri"
                v-model="formData.model_endpoint.uri"
              />
            </div>
            <Button
              type="primary"
              style="margin-top: 14px; margin-bottom: 14px;"
              @click="addHeader"
              size="small"
              >+{{ $t('com.createX', { obj: 'Header' }) }}</Button
            >
            <div class="header-controls">
              <div
                v-for="(header, index) in headerList"
                :key="index"
                class="header-pair"
              >
                <Input
                  class="header-input"
                  v-model="header.key"
                  placeholder="Header Key"
                  @on-change="onHeaderKeyChange(header)"
                />
                <span class="header-separator">:</span>
                <Input
                  class="header-input"
                  v-model="header.value"
                  placeholder="Header Value"
                  autocomplete="new-password"
                  @on-focus="onHeaderValueFocus(header)"
                  @on-change="onHeaderValueChange(header)"
                />
                <Button type="error" @click="removeHeader(index)" size="small"
                  >-</Button
                >
              </div>
            </div>
          </FormItem>
          <FormItem :label="$t('apiKey.models')" prop="models">
            <el-select
              v-model="formData.models"
              style="width: 487px;"
              size="small"
              multiple
              clearable
              filterable
              @change="onModelsChange"
            >
              <el-option
                v-for="item in modelsList"
                :value="item.id"
                :key="item.id"
                :label="item.id"
              >
              </el-option>
            </el-select>
            <Button
              type="primary"
              :disabled="!endpointHostDisplay || !formData.provider_type"
              :loading="btnLoading"
              @click="queryModels"
              >{{ $t('gatewayConfig.get') }}
            </Button>
          </FormItem>
        </Card>
        <Card
          :title="$t('gatewayConfig.modelRedirect')"
          class="llm-section-card"
        >
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
                      >
                        {{ item }}
                      </Option>
                    </Select>
                  </td>
                  <td>
                    <Button
                      type="error"
                      size="small"
                      @click="removeModelMapping(index)"
                      >{{ $t('com.del') }}</Button
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <Button
              class="mt20"
              size="small"
              type="primary"
              @click="addModelRedirect"
              >{{
                          $t('gatewayConfig.add')
              }}</Button
            >
          </FormItem>
        </Card>
        <Card
          :title="$t('gatewayConfig.serviceAuthKeys')"
          class="llm-section-card"
        >
          <FormItem prop="keys">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>{{ $t('gatewayConfig.keyName') }}</th>
                  <th>{{ $t('gatewayConfig.keyValue') }}</th>
                  <th style="width: 120px;">
                    {{ $t('gatewayConfig.keyWeight') }}
                  </th>
                  <th style="width: 80px;">{{ $t('com.operation') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(keyItem, index) in formData.keys"
                  :key="`key-${index}`"
                >
                  <td>
                    <FormItem
                      :prop="`keys.${index}.name`"
                      :rules="keyNameRules(index)"
                      class="inline-form-item"
                    >
                      <Input
                        v-model="keyItem.name"
                        :placeholder="$t('gatewayConfig.keyNamePlaceholder')"
                        @on-blur="validateKeysState"
                      />
                    </FormItem>
                  </td>
                  <td>
                    <FormItem
                      :prop="`keys.${index}.key`"
                      :rules="keyValueRules(index)"
                      class="inline-form-item"
                    >
                      <Input
                        v-model="keyItem.key"
                        :placeholder="$t('gatewayConfig.keyValuePlaceholder')"
                        autocomplete="new-password"
                      />
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
                    <Button
                      type="error"
                      size="small"
                      @click="removeKey(index)"
                      >{{ $t('com.del') }}</Button
                    >
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="keysWeightError" class="weight-error">
              {{ $t('gatewayConfig.keysWeightSumError') }}
            </p>
            <p v-if="keysPlaceholderError" class="weight-error">
              {{ $t('gatewayConfig.keysPlaceholderError') }}
            </p>
            <Button class="mt20" size="small" type="primary" @click="addKey"
              >+ {{ $t('gatewayConfig.addKey') }}</Button
            >
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
                  @on-change="onRetryBackoffInitialChange"
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
      </div>
    </Form>
  </div>
</template>

<script>
import { cloneDeep, isEmpty } from 'lodash';
import { maskSecretKey } from '@/utils/const';
import {
    getInstanceEndpointHosts,
    syncInstancePoolPortBySchema,
    detectInstanceMode
} from './InstancePool';
export default {
    components: {},
    props: {
        instancePoolData: {
            type: Array,
            default() {
                return [];
            }
        },
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
        originalLlmConfigKey: {
            type: String,
            default: ''
        },
        originalLlmConfigHeaders: {
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
        const validEndpoint = (rule, value, callback) => {
            const endpoint = value || {};
            const schema = endpoint.schema;
            const uri = endpoint.uri;

            if (!schema && !uri) {
                callback();
                return;
            }
            if (!schema) {
                callback(new Error(this.$t('gatewayConfig.schemaRequired')));
                return;
            }
            if (!uri) {
                callback(new Error(this.$t('gatewayConfig.uriRequired')));
                return;
            }

            if (!uri.startsWith('/')) {
                callback(new Error(this.$t('gatewayConfig.uriMustStartWithSlash')));
                return;
            }

            const uriPattern = /^[\/a-zA-Z0-9\-_\.~!$&'()*+,;=:@]*$/;
            if (!uriPattern.test(uri)) {
                callback(new Error(this.$t('gatewayConfig.uriContainsIllegalChars')));
                return;
            }

            if (uri.includes('//') && uri !== '//') {
                callback(new Error(this.$t('gatewayConfig.uriCannotConsecutiveSlash')));
                return;
            }

            if (uri.length > 1 && uri.endsWith('/')) {
                callback(new Error(this.$t('gatewayConfig.uriCannotEndWithSlash')));
                return;
            }

            callback();
        };

        const validModelMappings = (rule, value, callback) => {
            if (!value || !Array.isArray(value) || value.length === 0) {
                callback();
                return;
            }

            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const key = (item.source_model || '').trim();
                const val = (item.target_model || '').trim();

                if (!key && !val) {
                    continue;
                }

                if (!key) {
                    callback(new Error(this.$t('gatewayConfig.modelMappingKeyRequired', { line: i + 1 })));
                    return;
                }
                if (!val) {
                    callback(new Error(this.$t('gatewayConfig.modelMappingValueRequired', { line: i + 1 })));
                    return;
                }
            }

            const keys = value.map(item => item.source_model).filter(key => key !== '');

            const uniqueKeys = [...new Set(keys)];

            if (keys.length !== uniqueKeys.length) {
                callback(new Error(this.$t('gatewayConfig.duplicateModelName')));
                return;
            }

            callback();
        };
        return {
            ruleValidate: {
                provider_type: [],
                model_endpoint: [
                    {
                        required: false,
                        validator: validEndpoint
                    }
                ],
                model_mappings: [
                    {
                        required: false,
                        validator: validModelMappings
                    }
                ],
                models: [
                    {
                        required: true,
                        message: this.$t('gatewayConfig.modelsRequired')
                    }
                ],
                keys: [
                    {
                        required: false,
                        validator: this.validateKeys,
                        trigger: 'change'
                    }
                ],
                'key_policy.strategy': [
                    {
                        required: false,
                        message: this.$t('gatewayConfig.keyPolicyStrategyInvalid') || '选择策略仅支持 weighted_random',
                        trigger: 'change'
                    }
                ],
                'key_policy.max_retries': [
                    {
                        required: false,
                        type: 'number',
                        min: 0,
                        message: this.$t('gatewayConfig.keyPolicyMaxRetriesInvalid') || '最大重试次数必须大于或等于 0',
                        trigger: 'change'
                    }
                ],
                'key_policy.retry_backoff_initial': [
                    {
                        required: false,
                        type: 'number',
                        min: 0,
                        message: this.$t('gatewayConfig.keyPolicyBackoffInvalid') || '退避时间必须大于或等于 0',
                        trigger: 'change'
                    }
                ],
                'key_policy.retry_backoff_max': [
                    {
                        required: false,
                        type: 'number',
                        min: 0,
                        message: this.$t('gatewayConfig.keyPolicyBackoffInvalid') || '退避时间必须大于或等于 0',
                        trigger: 'change'
                    },
                    {
                        validator: this.validateRetryBackoffMax,
                        trigger: 'change'
                    }
                ],
                match_prefix: [
                    {
                        validator: this.validateMatchPrefix,
                        trigger: 'blur'
                    }
                ]
            },
            selectData: [],
            keysWeightError: false,
            keysPlaceholderError: false,
            keyNameRules: index => {
                const item = this.formData.keys[index] || {};
                const hasContent = String(item.name || '').trim() || String(item.key || '').trim();
                return [
                    { required: !!hasContent, message: this.$t('gatewayConfig.keyNameRequired'), trigger: 'blur' },
                    { type: 'string', min: 1, max: 128, message: this.$t('gatewayConfig.keyNameTooLong'), trigger: 'blur' },
                    { validator: this.validateKeyNameUnique, trigger: 'blur' }
                ];
            },
            keyValueRules: index => {
                const item = this.formData.keys[index] || {};
                const hasContent = String(item.name || '').trim() || String(item.key || '').trim();
                return [
                    { required: !!hasContent, message: this.$t('gatewayConfig.keyValueRequired'), trigger: 'blur' },
                    { type: 'string', min: 1, max: 512, message: this.$t('gatewayConfig.keyValueTooLong'), trigger: 'blur' }
                ];
            },
            keyWeightRules: index => {
                const item = this.formData.keys[index] || {};
                const hasContent = String(item.name || '').trim() || String(item.key || '').trim();
                return [
                    { required: !!hasContent, type: 'number', min: 0, max: 100, message: this.$t('gatewayConfig.keyWeightRangeError'), trigger: 'change' }
                ];
            },
            previousProviderType: '',
            formData: {
                provider_type: '',
                provider: '',
                match_prefix: '',
                strip_prefix: false,
                model_endpoint: {
                    schema: 'https',
                    uri: '/v1/models',
                    headers: {}
                },
                models: [],
                model_mappings: [
                    {
                        source_model: '',
                        target_model: ''
                    }
                ],
                keys: [
                    { name: '', key: '', weight: 100 }
                ],
                key_policy: {
                    strategy: 'weighted_random',
                    max_retries: 0,
                    retry_backoff_initial: 500,
                    retry_backoff_max: 5000
                }
            },
            headerList: [],
            modelsList: [],
            providers: [],

            btnLoading: false
        };
    },
    computed: {
        endpointHostDisplay() {
            const schema =
                (this.formData.model_endpoint && this.formData.model_endpoint.schema) || 'https';
            const hosts = getInstanceEndpointHosts(
                syncInstancePoolPortBySchema(this.instancePoolData, schema)
            );
            if (!hosts.length) {
                return '';
            }
            const modeInfo = detectInstanceMode(this.instancePoolData);
            if (modeInfo.mode === 'domain') {
                return hosts.join('\n');
            }
            return hosts[0];
        }
    },
    watch: {
        'formData.strip_prefix'(val) {
            if (!val) {
                this.formData.match_prefix = '';
            }
        },
        reportFlag: {
            handler(v) {
                this.handleSubmit('formData');
            }
        },
        llmConfigData: {
            handler(data) {
                if (!this.isAdd) {
                    if (!data || Object.keys(data).length === 0) {
                        this.resetLlmForm();
                        return;
                    }
                    if (data && !isEmpty(data)) {
                        this.applyLlmConfigData(data);
                    }
                }
            },
            immediate: true,
            deep: true
        },
        stepsCurrentState: {
            handler(val) {
                const endpoint = this.formData && this.formData.model_endpoint;
                const hasEndpoint = endpoint && endpoint.schema && endpoint.uri;

                if (hasEndpoint && val === 4) {
                    this.getProviders();
                    if (this.formData.provider_type) {
                        this.getModels();
                    }
                }
            },
            immediate: true
        }
    },
    mounted() {
        if (!this.isAdd) {
            this.$nextTick(() => {
                if (this.llmConfigData && Object.keys(this.llmConfigData).length > 0) {
                    this.applyLlmConfigData(this.llmConfigData);
                }
            });
        }
    },
    methods: {
        resetLlmForm() {
            this.formData = {
                provider_type: '',
                provider: '',
                match_prefix: '',
                strip_prefix: false,
                model_endpoint: {
                    schema: 'https',
                    uri: '/v1/models',
                    headers: {}
                },
                models: [],
                model_mappings: [
                    {
                        source_model: '',
                        target_model: ''
                    }
                ],
                keys: [
                    { name: '', key: '', weight: 100 }
                ],
                key_policy: {
                    strategy: 'weighted_random',
                    max_retries: 0,
                    retry_backoff_initial: 500,
                    retry_backoff_max: 5000
                }
            };
            this.keysWeightError = false;
            this.keysPlaceholderError = false;
            this.headerList = [];
        },
        addKey() {
            if (!Array.isArray(this.formData.keys)) {
                this.$set(this.formData, 'keys', []);
            }
            this.formData.keys.push({ name: '', key: '', weight: 0 });
            this.$nextTick(() => {
                this.validateKeysState();
            });
        },

        removeKey(index) {
            this.formData.keys.splice(index, 1);
            this.validateKeysState();
        },

        getKeyFieldIndex(field) {
            const match = field.match(/keys\.(\d+)\.name/);
            return match ? parseInt(match[1], 10) : -1;
        },

        validateKeyNameUnique(rule, value, callback) {
            const index = this.getKeyFieldIndex(rule.field);
            if (index < 0) {
                callback();
                return;
            }
            const currentName = String(value || '').trim();
            if (!currentName) {
                callback();
                return;
            }
            const keys = this.formData.keys || [];
            const duplicate = keys.some((item, idx) => {
                if (idx === index) return false;
                return String(item.name || '').trim() === currentName;
            });
            if (duplicate) {
                callback(new Error(this.$t('gatewayConfig.keyNameDuplicate') || 'Key 名称不能重复'));
                return;
            }
            callback();
        },

        validateKeysState() {
            const keys = this.formData.keys || [];
            const validKeys = keys.filter(item => {
                const name = String(item.name || '').trim();
                const key = String(item.key || '').trim();
                return name || key;
            });

            // 权重之和校验
            const sum = validKeys.reduce((acc, k) => acc + (Number(k.weight) || 0), 0);
            this.keysWeightError = validKeys.length > 0 && sum !== 100;

            const headers = (this.formData.model_endpoint && this.formData.model_endpoint.headers) || {};
            const hasPlaceholder = Object.values(headers).some(v => String(v).includes('${API_KEY}'));
            this.keysPlaceholderError = hasPlaceholder && validKeys.length === 0;
        },

        validateKeys(rule, value, callback) {
            this.validateKeysState();
            const keys = value || [];
            const validKeys = keys.filter(item => {
                const name = String(item.name || '').trim();
                const key = String(item.key || '').trim();
                return name || key;
            });
            const sum = validKeys.reduce((acc, k) => acc + (Number(k.weight) || 0), 0);
            if (validKeys.length > 0 && sum !== 100) {
                callback(new Error(this.$t('gatewayConfig.keysWeightSumError') || '所有 Key 的权重之和必须等于 100'));
                return;
            }
            callback();
        },

        validateRetryBackoffMax(rule, value, callback) {
            const initial = this.formData && this.formData.key_policy && this.formData.key_policy.retry_backoff_initial;
            if (value !== undefined && value !== null && initial !== undefined && initial !== null && value < initial) {
                callback(new Error(this.$t('gatewayConfig.keyPolicyBackoffMaxInvalid') || '最大退避时间必须大于或等于初始退避时间'));
                return;
            }
            callback();
        },

        validateMatchPrefix(rule, value, callback) {
            const prefix = String(value || '').trim();
            if (!prefix) {
                if (this.formData.strip_prefix) {
                    callback(new Error(this.$t('gatewayConfig.matchPrefixRequiredWhenStrip') || '开启裁剪前缀时，模型前缀匹配必填'));
                    return;
                }
                callback();
                return;
            }
            if (!prefix.endsWith('/')) {
                callback(new Error(this.$t('gatewayConfig.matchPrefixMustEndWithSlash') || '模型前缀匹配必须以 / 结尾'));
                return;
            }
            callback();
        },

        onRetryBackoffInitialChange() {
            this.$nextTick(() => {
                if (this.$refs.formData) {
                    this.$refs.formData.validateField('key_policy.retry_backoff_max');
                }
            });
        },
        applyLlmConfigData(data) {
            this.formData = cloneDeep(data);
            delete this.formData.key;
            delete this.formData.service_name;
            delete this.formData.group;
            this.initHeaders();
            if (!this.formData.model_endpoint) {
                this.$set(this.formData, 'model_endpoint', {
                    schema: 'https',
                    uri: '/v1/models',
                    headers: {}
                });
            }

            if (!this.formData.models) {
                this.$set(this.formData, 'models', []);
            }

            if (!this.formData.model_mappings || this.formData.model_mappings.length === 0) {
                this.$set(this.formData, 'model_mappings', [
                    {
                        source_model: '',
                        target_model: ''
                    }
                ]);
            }

            if (!Array.isArray(this.formData.keys) || this.formData.keys.length === 0) {
                this.$set(this.formData, 'keys', [{ name: '', key: '', weight: 100 }]);
            }

            if (!this.formData.key_policy) {
                this.$set(this.formData, 'key_policy', {
                    strategy: 'weighted_random',
                    max_retries: 0,
                    retry_backoff_initial: 500,
                    retry_backoff_max: 5000
                });
            }

            this.formData.provider = this.formData.provider || '';
            this.formData.match_prefix = this.formData.match_prefix || '';
            this.formData.strip_prefix = !!this.formData.strip_prefix;

            this.mergeSelectedModelsIntoList();
            this.validateKeysState();
            this.previousProviderType = this.formData.provider_type || '';
        },
        initHeaders() {
            const headers =
                (this.formData.model_endpoint && this.formData.model_endpoint.headers) || {};
            const originalHeaders = this.originalLlmConfigHeaders || {};

            this.headerList = Object.keys(headers).map(key => {
                const originalValue =
                    originalHeaders[key] != null ? String(originalHeaders[key]) : '';
                const currentValue = headers[key] != null ? String(headers[key]) : '';
                const hasOriginal = !!originalValue;
                const isUnchangedFromApi = hasOriginal && currentValue === originalValue;

                return {
                    key,
                    originalKey: hasOriginal ? key : '',
                    value: isUnchangedFromApi ? maskSecretKey(originalValue) : currentValue,
                    originalValue: hasOriginal ? originalValue : '',
                    valueModifiedInSession: hasOriginal ? !isUnchangedFromApi : !!currentValue
                };
            });
        },
        createEmptyHeaderRow() {
            return {
                key: '',
                originalKey: '',
                value: '',
                originalValue: '',
                valueModifiedInSession: false
            };
        },
        getHeaderMaskedValue(header) {
            return header.originalValue ? maskSecretKey(header.originalValue) : '';
        },
        isHeaderValueUnchanged(header) {
            if (!header.originalValue) {
                return !String(header.value || '').trim();
            }
            if (!header.valueModifiedInSession) {
                return true;
            }
            const trimmed = String(header.value || '').trim();
            if (!trimmed) {
                return true;
            }
            return trimmed === header.originalValue;
        },
        resolveHeaderValueForSubmit(header) {
            if (!header.originalValue) {
                return header.value;
            }
            if (this.isHeaderValueUnchanged(header)) {
                return header.originalValue;
            }
            return header.value;
        },
        onHeaderKeyChange(header) {
            if (header.originalKey && header.key !== header.originalKey) {
                header.originalKey = '';
                header.originalValue = '';
                header.valueModifiedInSession = true;
            }
        },
        onHeaderValueFocus(header) {
            if (header.originalValue && !header.valueModifiedInSession) {
                const masked = this.getHeaderMaskedValue(header);
                if (header.value === masked) {
                    header.value = '';
                    header.valueModifiedInSession = true;
                }
            }
        },
        onHeaderValueChange(header) {
            if (header.originalValue && !header.valueModifiedInSession) {
                const masked = this.getHeaderMaskedValue(header);
                if (header.value !== masked) {
                    header.valueModifiedInSession = true;
                }
            } else if (!header.originalValue && String(header.value || '').trim()) {
                header.valueModifiedInSession = true;
            }
        },
        addHeader() {
            this.headerList.push(this.createEmptyHeaderRow());
        },
        removeHeader(index) {
            this.headerList.splice(index, 1);
        },
        prepareHeadersForSubmit() {
            const headers = {};
            this.headerList.forEach(header => {
                if (header.key && header.key.trim() !== '') {
                    headers[header.key] = this.resolveHeaderValueForSubmit(header);
                }
            });
            return headers;
        },
        mergeSelectedModelsIntoList() {
            const selected = Array.isArray(this.formData.models) ? this.formData.models : [];
            const list = Array.isArray(this.modelsList) ? [...this.modelsList] : [];
            const existingIds = new Set(
                list.map(item => (item && item.id != null ? String(item.id) : ''))
            );
            selected.forEach(modelId => {
                if (modelId == null || modelId === '') {
                    return;
                }
                const id = String(modelId);
                if (!existingIds.has(id)) {
                    list.push({ id });
                    existingIds.add(id);
                }
            });
            this.modelsList = list;
        },

        onModelsChange() {
            this.$nextTick(() => {
                if (!this.$refs.formData) return;
                this.$refs.formData.validateField('models');
            });
        },

        addModelRedirect() {
            this.formData.model_mappings.push({
                source_model: '',
                target_model: ''
            });
        },

        removeModelMapping(index) {
            this.formData.model_mappings.splice(index, 1);

            this.$nextTick(() => {
                this.$refs.formData.validateField('model_mappings');
            });
        },

        changeMappingSource(index, newKey) {
            if (this.formData.model_mappings && this.formData.model_mappings[index]) {
                this.$set(this.formData.model_mappings[index], 'source_model', newKey);

                this.$nextTick(() => {
                    this.$refs.formData.validateField('model_mappings');
                });
            }
        },
        changeMappingTarget(index, newValue) {
            if (this.formData.model_mappings && this.formData.model_mappings[index]) {
                this.$set(this.formData.model_mappings[index], 'target_model', newValue);
            }
        },
        queryModels() {
            this.getModels('query');
        },
        getModels(val) {
            const schema = this.formData.model_endpoint.schema || 'https';
            const ipPort = [
                ...new Set(
                    getInstanceEndpointHosts(
                        syncInstancePoolPortBySchema(this.instancePoolData, schema)
                    )
                )
            ];
            this.modelsList = [];
            this.btnLoading = true;
            this.$request({
                url: 'tools/get-models-from-provider',
                method: 'post',
                data: {
                    schema,
                    uri: this.formData.model_endpoint.uri,
                    hosts: ipPort,
                    headers: this.prepareHeadersForSubmit(),
                    provider_type: this.formData.provider_type
                },
                openapi: true
            })
                .then(data => {
                    if (data.status === 200) {
                        this.modelsList = data.data.Data || [];
                        this.mergeSelectedModelsIntoList();
                        if (val) {
                            this.$Message.success({
                                content: this.$t('gatewayConfig.getModelListSucc')
                            });
                        }
                    } else {
                        console.error('获取模型列表失败，状态码:', data.status);
                        this.$Message.error('获取模型列表异常: ' + (error.message || '网络错误'));
                    }
                })
                .catch(error => {
                    console.error('获取模型列表异常:', error);

                })
                .finally(() => {
                    this.btnLoading = false;
                });
        },
        getProviders() {
            this.$request({
                url: 'model-provider-types',
                method: 'get',
                openapi: true
            }).then(data => {
                if (data.status === 200) {
                    this.providers = (data.data.Data || []).map(item => ({
                        id: item,
                        name: item
                    }));
                }
            });
        },
        handleSubmit(name) {
            this.$refs[name].validate(valid => {
                if (!valid) {
                    this.$Message.error(this.$t('com.tipValidateError'));
                    return;
                }

                let tmpData = {};
                tmpData = cloneDeep(this.formData);

                tmpData.model_endpoint = tmpData.model_endpoint || {};
                if (!tmpData.model_endpoint.schema) {
                    tmpData.model_endpoint.schema = 'https';
                }
                if (!tmpData.model_endpoint.uri) {
                    tmpData.model_endpoint.uri = '/v1/models';
                }
                tmpData.model_endpoint.headers = this.prepareHeadersForSubmit();
                if (tmpData.model_mappings && Array.isArray(tmpData.model_mappings)) {
                    tmpData.model_mappings = tmpData.model_mappings.filter(
                        item => item.source_model !== '' || item.target_model !== ''
                    );
                }

                if (!Array.isArray(tmpData.keys)) {
                    tmpData.keys = [];
                }
                tmpData.keys = tmpData.keys
                    .map(item => ({
                        name: String(item.name || '').trim(),
                        key: String(item.key || '').trim(),
                        weight: Number(item.weight) || 0
                    }))
                    .filter(item => item.name || item.key);

                const headers = (tmpData.model_endpoint && tmpData.model_endpoint.headers) || {};
                const hasPlaceholder = Object.values(headers).some(v => String(v).includes('${API_KEY}'));
                if (hasPlaceholder && tmpData.keys.length === 0) {
                    this.$Message.error(this.$t('gatewayConfig.keysPlaceholderError') || '请求头中包含 ${API_KEY} 占位符时，Keys 不能为空');
                    return;
                }

                if (!tmpData.key_policy) {
                    tmpData.key_policy = {
                        strategy: 'weighted_random',
                        max_retries: 0,
                        retry_backoff_initial: 500,
                        retry_backoff_max: 5000
                    };
                }

                delete tmpData.service_name;
                delete tmpData.group;
                if (!tmpData.provider_type) {
                    delete tmpData.provider_type;
                }
                if (!tmpData.match_prefix) {
                    delete tmpData.match_prefix;
                }
                if (!tmpData.strip_prefix) {
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
.endpoint-url-group {
    display: flex;
    align-items: center;
    max-width: 680px;
    border: 1px solid #dcdee2;
    border-radius: 4px;
    overflow: hidden;
    .endpoint-protocol {
        width: 80px;
        border-right: 1px solid #dcdee2;
        flex-shrink: 0;
        /deep/ .ivu-select-selection {
            border: none;
            border-radius: 0;
        }
    }
    .endpoint-host {
        min-width: 120px;
        padding: 0 8px;
        color: #909399;
        background: #f5f5f5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 30px;
        cursor: not-allowed;
    }
    .endpoint-uri {
        width: 180px;
        flex-shrink: 0;
        border-left: 1px solid #dcdee2;
        /deep/ .ivu-input {
            border: none;
            border-radius: 0;
        }
    }
}

.header-controls {
    width: 50%;
    display: flex;
    flex-direction: column;
    margin-left: 10px;
}

.header-pairs {
    margin-top: 10px;
}

.header-pair {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.header-input {
    flex: 1;
    margin: 0 5px;
}

.header-separator {
    margin: 0 5px;
    color: #666;
}

table {
    width: 100%;
    margin-top: 15px;
    font-size: 14px;
    @border-style:1px solid #e7e9f0;
    border-top: @border-style;
    border-left: @border-style;
    border-collapse: collapse;
    color: #000000a6;
    tbody {
        position: relative;
    }
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
    .table-title {
        font-weight: 500;
    }
    .spe_td {
        width: 400px;
        padding: 0px;
    }
}

.form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
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
        word-wrap: break-word;
        word-break: break-all;
    }

    th {
        background-color: #f8f8f9;
        font-size: 13px;
    }
}

.weight-error {
    color: #ed4014;
    margin-top: 8px;
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
</style>
