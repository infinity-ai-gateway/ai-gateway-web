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
    <div class="model-price-upsert">
        <Form
            ref="formData"
            :model="formData"
            :rules="ruleValidate"
            label-position="top"
        >
            <Row :gutter="24">
                <Col span="12">
                    <FormItem :label="$t('modelPrices.provider')" prop="provider">
                        <Input v-model="formData.provider" placeholder="deepseek" />
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem :label="$t('modelPrices.model')" prop="model">
                        <Input v-model="formData.model" placeholder="DeepSeek V3" />
                    </FormItem>
                </Col>
            </Row>
            <Row :gutter="24">
                <Col span="12">
                    <FormItem :label="$t('modelPrices.baseModel')" prop="base_model">
                        <Input v-model="formData.base_model" placeholder="deepseek-v3" />
                    </FormItem>
                </Col>
                <Col span="12">
            <FormItem :label="$t('modelPrices.mode')" prop="mode">
                <el-select v-model="formData.mode" style="width: 100%;" size="small" filterable>
                    <el-option v-for="item in modeOptions" :key="item" :value="item" :label="item" />
                </el-select>
            </FormItem>
                </Col>
            </Row>

            <FormItem :label="$t('modelPrices.capabilities')">
                <el-select v-model="formData.capabilities" style="width: 100%;" size="small" multiple filterable clearable>
                    <el-option v-for="item in capabilityOptions" :key="item" :value="item" :label="item" />
                </el-select>
            </FormItem>

            <FormItem :label="$t('modelPrices.supportedParameters')">
                <el-select v-model="formData.supported_parameters" style="width: 100%;" size="small" multiple filterable clearable>
                    <el-option v-for="item in supportedParameterOptions" :key="item" :value="item" :label="item" />
                </el-select>
            </FormItem>

            <Card :title="$t('modelPrices.limits')" class="dynamic-card">
                <div
                    v-for="(entry, index) in limitsList"
                    :key="`limit-${index}`"
                    class="dynamic-row"
                >
                    <Row :gutter="8">
                        <Col span="10">
                            <el-select v-model="entry.key" style="width: 100%;" size="small" filterable clearable placeholder="键名">
                                <el-option v-for="item in limitKeyOptions" :key="item" :value="item" :label="item" />
                            </el-select>
                        </Col>
                        <Col span="10">
                            <InputNumber v-model="entry.value" :min="0" :precision="0" style="width: 100%;" placeholder="值" />
                        </Col>
                        <Col span="4">
                            <Button type="error" size="small" @click="removeLimit(index)">{{ $t('com.del') }}</Button>
                        </Col>
                    </Row>
                </div>
                <Button size="small" type="primary" @click="addLimit">+ {{ $t('modelPrices.addLimit') }}</Button>
                <p v-if="limitsDuplicateError" class="error-text">{{ $t('modelPrices.limitsDuplicateKey') }}</p>
                <p v-if="limitsValueError" class="error-text">{{ $t('modelPrices.limitsValueInvalid') }}</p>
            </Card>

            <Card :title="$t('modelPrices.prices')" class="dynamic-card">
                <div
                    v-for="(entry, index) in pricesList"
                    :key="`price-${index}`"
                    class="dynamic-row"
                >
                    <Row :gutter="8">
                        <Col span="10">
                            <el-select v-model="entry.key" style="width: 100%;" size="small" filterable clearable placeholder="价格项">
                                <el-option v-for="item in priceKeyOptions" :key="item" :value="item" :label="item" />
                            </el-select>
                        </Col>
                        <Col span="10">
                            <InputNumber v-model="entry.value" :min="0" :precision="8" style="width: 100%;" placeholder="价格" />
                        </Col>
                        <Col span="4">
                            <Button type="error" size="small" @click="removePrice(index)">{{ $t('com.del') }}</Button>
                        </Col>
                    </Row>
                </div>
                <Button size="small" type="primary" @click="addPrice">+ {{ $t('modelPrices.addPrice') }}</Button>
                <p v-if="pricesError" class="error-text">{{ $t('modelPrices.pricesRequired') }}</p>
                <p v-if="pricesDuplicateError" class="error-text">{{ $t('modelPrices.pricesDuplicateKey') }}</p>
                <p v-if="pricesValueError" class="error-text">{{ $t('modelPrices.pricesValueInvalid') }}</p>
            </Card>

            <Card :title="$t('modelPrices.metadata')" class="dynamic-card">
                <FormItem :label="$t('modelPrices.source')" prop="metadata.source">
                    <Input v-model="formData.metadata.source" placeholder="https://..." />
                </FormItem>
                <FormItem :label="$t('modelPrices.notes')">
                    <Input v-model="formData.metadata.notes" type="textarea" :rows="3" />
                </FormItem>
            </Card>

            <FormItem class="drawer-footer">
                <Button type="primary" size="small" :loading="submitting" @click="handleSubmit">
                    {{ $t('com.submit') }}
                </Button>
                <Button size="small" style="margin-left: 8px;" @click="onCancel">
                    {{ $t('com.cancel') }}
                </Button>
            </FormItem>
        </Form>
    </div>
</template>

<script>
import { cloneDeep } from 'lodash';

const MODE_OPTIONS = [
    'chat', 'completion', 'responses', 'image_generation', 'image_edit',
    'embedding', 'rerank', 'audio_speech', 'audio_transcription',
    'video_generation', 'ocr', 'search', 'realtime'
];

const CAPABILITY_OPTIONS = [
    'chat', 'vision', 'audio_input', 'video_input', 'reasoning', 'tools',
    'structured_outputs', 'function_calling', 'prompt_caching', 'computer_use',
    'web_search', 'serverless', 'image_generation', 'embedding', 'rerank',
    'audio_speech', 'audio_transcription', 'video_generation', 'ocr', 'search', 'realtime'
];

const SUPPORTED_PARAMETER_OPTIONS = [
    'temperature', 'top_p', 'max_tokens', 'tools', 'tool_choice',
    'response_format', 'reasoning', 'image_input', 'video_input', 'audio_input',
    'voice', 'speed', 'size', 'quality', 'style'
];

const LIMIT_KEY_OPTIONS = [
    'context_window', 'max_input_tokens', 'max_output_tokens', 'max_tokens'
];

const PRICE_KEY_OPTIONS = [
    'input_cost_per_token', 'output_cost_per_token',
    'cache_read_input_token_cost', 'cache_creation_input_token_cost',
    'input_cost_per_token_above_200k_tokens', 'output_cost_per_token_above_200k_tokens',
    'output_cost_per_image', 'output_cost_per_pixel', 'output_cost_per_second',
    'input_cost_per_query', 'search_context_cost_per_query', 'ocr_cost_per_page',
    'output_cost_per_character', 'output_cost_per_image_hd', 'output_cost_per_video',
    'output_cost_per_video_per_second'
];

export default {
    name: 'ModelPriceUpsert',

    props: {
        currentData: {
            type: Object,
            default() {
                return {};
            }
        }
    },

    data() {
        const that = this;
        return {
            modeOptions: MODE_OPTIONS,
            capabilityOptions: CAPABILITY_OPTIONS,
            supportedParameterOptions: SUPPORTED_PARAMETER_OPTIONS,
            limitKeyOptions: LIMIT_KEY_OPTIONS,
            priceKeyOptions: PRICE_KEY_OPTIONS,
            pricesError: false,
            limitsDuplicateError: false,
            pricesDuplicateError: false,
            limitsValueError: false,
            pricesValueError: false,
            submitting: false,
            formData: {
                provider: '',
                model: '',
                base_model: '',
                mode: 'chat',
                capabilities: [],
                supported_parameters: [],
                limits: {},
                prices: {},
                metadata: {
                    source: '',
                    notes: ''
                }
            },
            limitsList: [],
            pricesList: [],
            ruleValidate: {
                provider: [
                    { required: true, message: this.$t('modelPrices.providerRequired'), trigger: 'blur' },
                    { type: 'string', min: 1, max: 255, message: '长度 1-255', trigger: 'blur' }
                ],
                model: [
                    { required: true, message: this.$t('modelPrices.modelRequired'), trigger: 'blur' },
                    { type: 'string', min: 1, max: 255, message: '长度 1-255', trigger: 'blur' }
                ],
                base_model: [
                    { required: true, message: this.$t('modelPrices.baseModelRequired'), trigger: 'blur' },
                    { type: 'string', min: 1, max: 255, message: '长度 1-255', trigger: 'blur' }
                ],
                mode: [
                    { required: true, message: this.$t('modelPrices.modeRequired'), trigger: 'change' }
                ],
                'metadata.source': [
                    {
                        validator: (rule, value, callback) => {
                            if (!value) {
                                callback();
                                return;
                            }
                            const urlPattern = /^(https?:\/\/)?(([\w-]+\.)+[\w-]+|localhost)(:\d+)?(\/[\w./?%&=-]*)?$/i;
                            if (!urlPattern.test(value)) {
                                callback(new Error(this.$t('modelPrices.sourceUrlInvalid')));
                                return;
                            }
                            callback();
                        },
                        trigger: 'blur'
                    }
                ]
            }
        };
    },

    watch: {
        currentData: {
            handler(data) {
                if (data && data.id) {
                    this.formData = cloneDeep(data);
                    this.limitsList = this.objectToList(this.formData.limits || {});
                    this.pricesList = this.objectToList(this.formData.prices || {});
                } else {
                    this.resetForm();
                }
            },
            immediate: true,
            deep: true
        }
    },

    methods: {
        resetForm() {
            this.formData = {
                provider: '',
                model: '',
                base_model: '',
                mode: 'chat',
                capabilities: [],
                supported_parameters: [],
                limits: {},
                prices: {},
                metadata: {
                    source: '',
                    notes: ''
                }
            };
            this.limitsList = [];
            this.pricesList = [];
            this.pricesError = false;
            this.limitsDuplicateError = false;
            this.pricesDuplicateError = false;
            this.limitsValueError = false;
            this.pricesValueError = false;
        },

        objectToList(obj) {
            return Object.keys(obj || {}).map(key => ({ key, value: obj[key] }));
        },

        listToObject(list) {
            const result = {};
            (list || []).forEach(item => {
                if (item.key !== '' && item.value !== '' && item.value !== null && item.value !== undefined) {
                    result[item.key] = Number(item.value);
                }
            });
            return result;
        },

        getDuplicateKeys(list) {
            const seen = new Set();
            const duplicates = new Set();
            (list || []).forEach(item => {
                const key = item.key;
                if (!key) return;
                if (seen.has(key)) {
                    duplicates.add(key);
                } else {
                    seen.add(key);
                }
            });
            return [...duplicates];
        },

        validateDynamicKeys() {
            const limitsDuplicates = this.getDuplicateKeys(this.limitsList);
            const pricesDuplicates = this.getDuplicateKeys(this.pricesList);
            this.limitsDuplicateError = limitsDuplicates.length > 0;
            this.pricesDuplicateError = pricesDuplicates.length > 0;

            // limits 值须为非负整数；prices 值须为非负数
            this.limitsValueError = this.limitsList.some(item => {
                if (!item.key) return false;
                const value = Number(item.value);
                return Number.isNaN(value) || value < 0 || !Number.isInteger(value);
            });
            this.pricesValueError = this.pricesList.some(item => {
                if (!item.key) return false;
                const value = Number(item.value);
                return Number.isNaN(value) || value < 0;
            });

            return !this.limitsDuplicateError && !this.pricesDuplicateError
                && !this.limitsValueError && !this.pricesValueError;
        },

        addLimit() {
            this.limitsList.push({ key: '', value: 0 });
        },

        removeLimit(index) {
            this.limitsList.splice(index, 1);
        },

        addPrice() {
            this.pricesList.push({ key: '', value: 0 });
        },

        removePrice(index) {
            this.pricesList.splice(index, 1);
        },

        buildPayload() {
            const data = cloneDeep(this.formData);
            data.limits = this.listToObject(this.limitsList);
            data.prices = this.listToObject(this.pricesList);
            return data;
        },

        handleSubmit() {
            this.pricesError = this.pricesList.length === 0 || this.pricesList.every(item =>
                item.key === '' || item.value === '' || item.value === null || item.value === undefined
            );
            const dynamicKeysValid = this.validateDynamicKeys();

            this.$refs.formData.validate(valid => {
                if (!valid) {
                    this.$Message.error(this.$t('com.tipValidateError'));
                    return;
                }
                if (!dynamicKeysValid) {
                    return;
                }
                if (this.pricesError) {
                    this.$Message.error(this.$t('modelPrices.pricesRequired'));
                    return;
                }

                const payload = this.buildPayload();
                const isEdit = !!this.currentData.id;

                // 编辑模式下 provider/model/mode 都没改动，直接提交
                if (isEdit) {
                    const orig = this.currentData;
                    const unchanged =
                        orig.provider === payload.provider &&
                        orig.model === payload.model &&
                        orig.mode === payload.mode;
                    if (unchanged) {
                        this.doSubmit(payload, isEdit);
                        return;
                    }
                }

                // 校验 (provider, model, mode) 组合唯一性
                this.submitting = true;
                this.$request({
                    url: 'model-prices',
                    method: 'get',
                    params: {
                        provider: payload.provider,
                        model: payload.model,
                        mode: payload.mode
                    },
                    openapi: true
                }).then(res => {
                    const data = res.data && res.data.Data;
                    // 后端返回单条记录时存在 id；返回分页列表时检查 list 长度
                    const isDuplicate = data && (
                        data.id || (Array.isArray(data.list) && data.list.length > 0)
                    );
                    if (isDuplicate) {
                        this.$Message.error(this.$t('modelPrices.duplicateCombo'));
                        this.submitting = false;
                    } else {
                        this.doSubmit(payload, isEdit);
                    }
                }).catch(err => {
                    // 404 表示不存在，可以提交；其他错误提示但仍让后端处理
                    if (err && err.response && err.response.status === 404) {
                        this.doSubmit(payload, isEdit);
                    } else {
                        console.error('校验组合唯一性失败:', err);
                        this.doSubmit(payload, isEdit);
                    }
                });
            });
        },

        doSubmit(payload, isEdit) {
            this.submitting = true;
            this.$request({
                url: isEdit ? `model-prices/${this.currentData.id}` : 'model-prices',
                method: isEdit ? 'put' : 'post',
                data: payload,
                openapi: true
            }).then(res => {
                if (res.status === 200) {
                    this.$Message.success(this.$t('com.tipSubmitSucc'));
                    this.$emit('submit');
                } else {
                    this.$Message.error(this.$t('com.tipSubmitFailed'));
                }
            }).catch(err => {
                console.error('提交模型定价失败:', err);
                this.$Message.error(this.$t('com.tipSubmitFailed'));
            }).finally(() => {
                this.submitting = false;
            });
        },

        onCancel() {
            this.$emit('cancel');
        }
    }
};
</script>

<style lang="less" scoped>
.model-price-upsert {
    .dynamic-card {
        margin-bottom: 16px;
    }

    .dynamic-row {
        margin-bottom: 10px;
    }

    .error-text {
        color: #ed4014;
        margin-top: 8px;
    }

    .drawer-footer {
        margin-top: 24px;
        text-align: right;
    }
}
</style>
