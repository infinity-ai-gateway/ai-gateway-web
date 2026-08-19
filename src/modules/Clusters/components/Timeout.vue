/**
* Copyright(c) 2026 The rainway-ai-gateway Authors. 
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
    <Form ref="formData" label-position="top" :model="formData" :rules="ruleValidate">
        <FormItem
            v-if="formData.timeouts"
            :label="$t('cluster.timeoutReadClientAgain')"
            prop="timeouts.timeout_read_client_again"
        >
            <InputNumber
                v-model="formData.timeouts['timeout_read_client_again']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
        <FormItem
            v-if="formData.timeouts"
            :label="$t('cluster.timeoutReadbodyClient')"
            prop="timeouts.timeout_readbody_client"
        >
            <InputNumber
                v-model="formData.timeouts['timeout_readbody_client']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
        <FormItem
            v-if="formData.timeouts"
            :label="$t('cluster.timeoutConnServ')"
            prop="timeouts.timeout_conn_serv"
        >
            <InputNumber
                v-model="formData.timeouts['timeout_conn_serv']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
        <FormItem
            v-if="formData.timeouts"
            :label="$t('cluster.timeoutResHeader')"
            prop="timeouts.timeout_response_header"
        >
            <InputNumber
                v-model="formData.timeouts['timeout_response_header']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
        <FormItem
            v-if="formData.timeouts"
            :label="$t('cluster.timeoutWriteClient')"
            prop="timeouts.timeout_write_client"
        >
            <InputNumber
                v-model="formData.timeouts['timeout_write_client']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
        <FormItem
            v-if="formData.retries"
            :label="$t('cluster.maxRetryInCluster')"
            prop="retries.max_retry_in_cluster"
        >
            <InputNumber
                v-model="formData.retries['max_retry_in_cluster']"
                style="width: 100%;"
            ></InputNumber>
        </FormItem>
    </Form>
</template>
<script>
import { cloneDeep } from 'lodash';
import { NumRegCheck } from '@/utils/const';
export default {
    name: 'Timeout',

    props: {
        baseConfigData: {
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
        baseConfigData: {
            handler(data) {
                this.formData = cloneDeep(data);
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
        const timeoutValidate = (rule, value, callback) => {
            if (value === null || value === undefined || value === '') {
                callback();
                return;
            }
            if (!NumRegCheck(value) || value <= 0) {
                callback(new Error(this.$t('cluster.timeoutValueMustGreaterThanZero')));
                return;
            }
            if (value > 99999999) {
                callback(new Error(this.$t('cluster.tipsValueMax')));
                return;
            }
            callback();
        };
        const retryValidate = (rule, value, callback) => {
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
        return {
            formData: {},
            ruleValidate: {
                'timeouts.timeout_read_client_again': [
                    {
                        required: false,
                        trigger: '',
                        validator: timeoutValidate
                    }
                ],
                'timeouts.timeout_readbody_client': [
                    {
                        required: false,
                        trigger: 'change',
                        validator: timeoutValidate
                    }
                ],
                'timeouts.timeout_conn_serv': [
                    {
                        required: false,
                        trigger: 'change',
                        validator: timeoutValidate
                    }
                ],
                'timeouts.timeout_response_header': [
                    {
                        required: false,
                        trigger: 'change',
                        validator: timeoutValidate
                    }
                ],
                'timeouts.timeout_write_client': [
                    {
                        required: false,
                        trigger: 'change',
                        validator: timeoutValidate
                    }
                ],
                'retries.max_retry_in_cluster': [
                    {
                        required: false,
                        trigger: 'change',
                        validator: retryValidate
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
                    topic: 'baseConfigData',
                    data: this.formData
                });
            });
        }
    }
};
</script>
