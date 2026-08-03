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
    <div class="health-check">
        <Form ref="formData" label-position="top" :model="formData" :rules="ruleValidate">
            <FormItem :label="$t('cluster.healthCheckFailnum')" prop="failnum">
                <InputNumber v-model="formData['failnum']" class="from-item-inp" :min="0" />
            </FormItem>
            <FormItem :label="$t('cluster.healthCheckInterval')" prop="interval">
                <InputNumber v-model="formData['interval']" class="from-item-inp" :min="0" />
            </FormItem>
            <FormItem :label="$t('cluster.healthCheckHost')" prop="host">
                <Input v-model="formData['host']" placeholder="example.com" />
                <p class="form-tip">{{ $t('cluster.healthCheckHostTip') }}</p>
            </FormItem>
            <FormItem :label="$t('cluster.healthCheckUri')" prop="uri">
                <Input v-model="formData['uri']" placeholder="/" />
            </FormItem>
            <FormItem :label="$t('cluster.healthCheckStatuscode')" prop="statuscode">
                <InputNumber v-model="formData['statuscode']" class="from-item-inp" :min="0" />
            </FormItem>
        </Form>
    </div>
</template>
<script>
import { cloneDeep } from 'lodash';
import { isHostname, NumRegCheck } from '@/utils/const';

export const PASSIVE_HEALTH_CHECK_DEFAULTS = {
    failnum: 3,
    interval: 1000,
    host: '',
    uri: '/',
    statuscode: 0
};

export function formatPassiveHealthCheckForApi(data) {
    const source = data || {};
    const result = {
        failnum: source.failnum != null && source.failnum !== ''
            ? parseInt(source.failnum, 10)
            : PASSIVE_HEALTH_CHECK_DEFAULTS.failnum,
        interval: source.interval != null && source.interval !== ''
            ? parseInt(source.interval, 10)
            : PASSIVE_HEALTH_CHECK_DEFAULTS.interval,
        host: source.host != null ? String(source.host) : PASSIVE_HEALTH_CHECK_DEFAULTS.host,
        uri: source.uri ? String(source.uri) : PASSIVE_HEALTH_CHECK_DEFAULTS.uri,
        statuscode: source.statuscode != null && source.statuscode !== ''
            ? parseInt(source.statuscode, 10)
            : PASSIVE_HEALTH_CHECK_DEFAULTS.statuscode
    };
    if (!result.uri) {
        result.uri = PASSIVE_HEALTH_CHECK_DEFAULTS.uri;
    }
    return result;
}

export default {
    name: 'passiveHealthCheck',

    props: {
        passiveHealthData: {
            type: Object,
            default() {
                return {};
            }
        },
        isAdd: {
            type: Boolean,
            default: false
        },
        reportFlag: {
            type: Boolean,
            default: false
        }
    },

    watch: {
        passiveHealthData: {
            handler(data) {
                if (!this.isAdd && data) {
                    this.formData = {
                        ...cloneDeep(PASSIVE_HEALTH_CHECK_DEFAULTS),
                        ...cloneDeep(data)
                    };
                }
            },
            immediate: true,
            deep: true
        },
        reportFlag: {
            handler(v) {
                this.handleSubmit('formData');
            }
        }
    },
    data() {
        const validateOptionalNonNegativeInt = () => (rule, value, callback) => {
            if (value === null || value === undefined || value === '') {
                callback();
                return;
            }
            if (!NumRegCheck(value) || value < 0) {
                callback(new Error(this.$t('cluster.tipValueNonnegativeInteger')));
                return;
            }
            if (value > 99999999) {
                callback(new Error(this.$t('cluster.tipsValueMax')));
                return;
            }
            callback();
        };
        const validateHealthcheckHost = (rule, value, callback) => {
            if (value === '' || value === undefined || value === null) {
                callback();
                return;
            }
            if (!isHostname(value)) {
                callback(new Error(this.$t('instancePool.invalidDomain')));
                return;
            }
            callback();
        };
        const validateHealthcheckUri = (rule, value, callback) => {
            if (value === '' || value === undefined || value === null) {
                callback();
                return;
            }
            if (!/^\//.test(value)) {
                callback(
                    new Error(
                        this.$t('com.tipMustStartWithX', { obj: this.$t('cluster.reqUri') })
                    )
                );
                return;
            }
            callback();
        };
        return {
            formData: {
                ...PASSIVE_HEALTH_CHECK_DEFAULTS
            },
            ruleValidate: {
                interval: [
                    {
                        required: false,
                        validator: validateOptionalNonNegativeInt(),
                        trigger: 'change'
                    }
                ],
                failnum: [
                    {
                        required: false,
                        validator: validateOptionalNonNegativeInt(),
                        trigger: 'change'
                    }
                ],
                host: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: validateHealthcheckHost
                    }
                ],
                uri: [
                    {
                        required: false,
                        validator: validateHealthcheckUri,
                        trigger: 'change'
                    }
                ],
                statuscode: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (value === null || value === undefined || value === '') {
                                callback();
                                return;
                            }
                            if (!NumRegCheck(value) || value < 0) {
                                callback(new Error(this.$t('cluster.tipValueNonnegativeInteger')));
                                return;
                            }
                            if (value !== 0 && (value < 100 || value > 599)) {
                                callback(new Error(this.$t('cluster.healthCheckStatuscodeRangeError')));
                                return;
                            }
                            callback();
                        }
                    }
                ]
            }
        };
    },
    methods: {
        handleSubmit(name) {
            this.$refs[name].validate(valid => {
                if (!valid) {
                    this.$Message.error(this.$t('com.tipValidateError'));
                    return;
                }
                this.$emit('submitData', {
                    topic: 'passiveHealthData',
                    data: formatPassiveHealthCheckForApi(this.formData)
                });
            });
        }
    }
};
</script>
<style lang="less" scoped>
.health-check {
    .from-item-inp {
        width: 100%;
    }

    .form-tip {
        margin-top: 4px;
        color: #808695;
        font-size: 12px;
        line-height: 1.5;
    }
}
</style>
