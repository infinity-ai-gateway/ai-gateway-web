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
    <div>
        <Form ref="formData" :model="formData" :rules="formRules" label-position="top">
            <FormItem
                :label="$t('instancePool.instanceMode')"
                prop="instanceMode"
                style="width: 100%;"
            >
                <Select
                    v-model="formData.instanceMode"
                    style="width: 240px;"
                >
                    <Option value="ip">{{ $t('instancePool.modeIp') }}</Option>
                    <Option value="domain">{{ $t('instancePool.modeDomain') }}</Option>
                </Select>
            </FormItem>

            <FormItem
                v-if="formData.instanceMode === 'domain'"
                :label="$t('instancePool.domain')"
                prop="domainName"
                style="width: 100%;"
            >
                <Input
                    v-model="formData.domainName"
                    type="text"
                    :placeholder="$t('instancePool.domainPlaceholder')"
                    style="max-width: 480px;"
                />
            </FormItem>
            <FormItem
                v-if="formData.instanceMode === 'domain'"
                :label="$t('instancePool.weight')"
            >
                <InputNumber :value="100" disabled style="width: 120px;" />
            </FormItem>

            <FormItem
                v-else
                :label="$t('instancePool.list')"
                style="width: 100%;"
            >
                <div class="formBox">
                    <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <th>{{ $t('instancePool.ipAddress') }}</th>
                            <th>{{ $t('instancePool.port') }}</th>
                            <th>{{ $t('instancePool.weight') }}</th>
                            <th>{{ $t('com.operation') }}</th>
                        </tr>
                        <tr v-for="(item, ind) in formData.instances" :key="ind">
                            <td>
                                <FormItem
                                    :prop="'instances.' + ind + '.ip'"
                                    :rules="instanceIpRules"
                                    :show-message="false"
                                    class="table-cell-form-item"
                                >
                                    <Input
                                        v-model="item.ip"
                                        type="text"
                                        :placeholder="
                                            $t('com.tipEnterX', { obj: $t('instancePool.ipAddress') })
                                        "
                                        @on-change="validateInstanceRow(ind)"
                                        @on-blur="validateInstanceRow(ind)"
                                    />
                                </FormItem>
                            </td>
                            <td>
                                <div v-for="(info, index) in item.ports" :key="index">
                                    <Input
                                        value="Default"
                                        class="poolInput"
                                        type="text"
                                        :placeholder="$t('instancePool.portName')"
                                        style="width: 80px;"
                                        disabled
                                    />：
                                    <FormItem
                                        :prop="'instances.' + ind + '.ports.Default'"
                                        :rules="instancePortRules"
                                        :show-message="false"
                                        class="table-cell-form-item table-cell-form-item-port"
                                    >
                                        <InputNumber
                                            v-model="item.ports.Default"
                                            :max="65535"
                                            :min="1"
                                            class="poolInput"
                                            :placeholder="$t('instancePool.portValue')"
                                            style="width: 80px;"
                                            @on-change="onInstancePortChange(item.ports, 'Default', ind)"
                                            @on-blur="validateInstanceRow(ind)"
                                        ></InputNumber>
                                    </FormItem>
                                </div>
                            </td>
                            <td>
                                <FormItem
                                    :prop="'instances.' + ind + '.weight'"
                                    :rules="instanceWeightRules"
                                    :show-message="false"
                                    class="table-cell-form-item"
                                >
                                    <InputNumber
                                        v-model="item.weight"
                                        :max="100"
                                        :min="0"
                                        class="poolInput"
                                        style="width: 80px;"
                                        @on-change="onInstanceWeightChange(ind)"
                                        @on-blur="validateInstanceRow(ind)"
                                    ></InputNumber>
                                </FormItem>
                            </td>
                            <td>
                                <Button
                                    size="small"
                                    type="error"
                                    :disabled="!deleteAble"
                                    @click="handleRemove(ind)"
                                >{{ $t('com.del') }}</Button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-if="instanceErrorMessage" class="instance-error-tip">
                    {{ instanceErrorMessage }}
                </div>
                <Button plain size="small" type="primary" @click="handleAdd">
                    + {{ $t('com.create') }}
                </Button>
            </FormItem>
        </Form>
    </div>
</template>

<script>
import { cloneDeep } from 'lodash';
import { isIP } from 'validator';
import { isHostname, NumRegCheck } from '@/utils/const';

const DOMAIN_PORT = 443;
const DOMAIN_WEIGHT = 100;

function createEmptyInstance() {
    return {
        ports: { Default: 80 },
        ip: '',
        weight: 100
    };
}

export function getDomainValidationError(value) {
    const domain = String(value || '').trim();
    if (!domain) {
        return 'empty';
    }
    if (!isHostname(domain)) {
        return 'invalid';
    }
    return null;
}

export function validateDomainName(value) {
    return getDomainValidationError(value) === null;
}

export function parseInstancePool(instancePool) {
    if (!instancePool) {
        return [];
    }
    if (Array.isArray(instancePool)) {
        return instancePool.map(item => normalizeInstance(item));
    }
    return [];
}

export function getClusterInstancePool(cluster) {
    if (!cluster || typeof cluster !== 'object') {
        return [];
    }
    if (Array.isArray(cluster.instance_pool)) {
        return cluster.instance_pool;
    }
    return [];
}

export function detectInstanceMode(instances) {
    const list = (instances || []).map(item => normalizeInstance(item));
    if (list.length !== 1) {
        return {
            mode: 'ip',
            domain: ''
        };
    }

    const item = list[0];
    const hostname = String(item.hostname || '').trim();
    const ip = String(item.ip || '').trim();

    if (hostname && !ip) {
        return {
            mode: 'domain',
            domain: hostname
        };
    }

    return {
        mode: 'ip',
        domain: ''
    };
}

export function normalizeInstance(instance) {
    const item = cloneDeep(instance || {});
    if (!item.ports || typeof item.ports !== 'object' || item.ports.Default == null || item.ports.Default === '') {
        item.ports = { Default: 80 };
    } else {
        item.ports = { Default: parseInt(item.ports.Default, 10) };
    }
    if (item.weight == null || item.weight === '') {
        item.weight = 100;
    } else {
        item.weight = parseInt(item.weight, 10);
    }
    item.hostname = item.hostname != null ? String(item.hostname) : '';
    item.ip = item.ip != null ? String(item.ip) : '';
    return item;
}

export function formatInstanceForApi(instance, mode) {
    const item = normalizeInstance(instance);
    const port = parseInt(item.ports.Default, 10);
    const weight = item.weight != null ? parseInt(item.weight, 10) : 0;

    if (mode === 'domain') {
        const hostname = String(item.hostname || '').trim();
        return {
            hostname,
            weight,
            ports: {
                Default: port
            }
        };
    }

    const ip = String(item.ip || '').trim();
    return {
        ip,
        weight,
        ports: {
            Default: port
        }
    };
}

export function formatInstancePoolForApi(instances) {
    const list = instances || [];
    const { mode } = detectInstanceMode(list);
    return list.map(item => formatInstanceForApi(item, mode));
}

export function getInstanceEndpointHosts(instances) {
    const list = parseInstancePool(instances);
    const { mode } = detectInstanceMode(list);
    return list.map(instance => {
        const port = instance.ports && instance.ports.Default != null
            ? instance.ports.Default
            : 80;
        if (mode === 'domain') {
            const host = String(instance.hostname || '').trim();
            return `${host}:${port}`;
        }
        return `${instance.ip}:${port}`;
    }).filter(Boolean);
}

function buildDomainInstance(domain) {
    const value = String(domain || '').trim();
    return {
        hostname: value,
        ports: { Default: DOMAIN_PORT },
        weight: DOMAIN_WEIGHT
    };
}

function toIpFormInstance(instance) {
    const item = normalizeInstance(instance);
    return {
        ip: String(item.ip || '').trim(),
        ports: cloneDeep(item.ports),
        weight: item.weight != null ? parseInt(item.weight, 10) : 100
    };
}

export default {
    name: 'cluster-instance-pool',

    props: {
        instancePoolData: {
            type: [Array, Object],
            default() {
                return [];
            }
        },
        reportFlag: {
            type: Boolean
        }
    },

    watch: {
        instancePoolData: {
            handler(data) {
                this.applyInstancePoolData(data);
            },
            immediate: true,
            deep: true
        },
        reportFlag: {
            handler() {
                this.handleSubmit();
            }
        },
        'formData.instanceMode'(newVal, oldVal) {
            if (this.isApplyingPoolData || newVal === oldVal) {
                return;
            }
            if (this.$refs.formData) {
                this.$refs.formData.clearValidate && this.$refs.formData.clearValidate();
            }
            if (newVal === 'domain') {
                this.formData.instances = [];
                this.formData.domainName = '';
                this.deleteAble = false;
                return;
            }
            this.formData.domainName = '';
            if (!this.formData.instances || this.formData.instances.length === 0) {
                this.formData.instances = [createEmptyInstance()];
            }
            this.deleteAble = this.formData.instances.length > 1;
        }
    },

    computed: {
        formRules() {
            const rules = {
                instanceMode: [
                    {
                        required: true,
                        message: this.$t('com.tipNotEmptyX', { obj: this.$t('instancePool.instanceMode') }),
                        trigger: 'change'
                    }
                ]
            };
            if (this.formData.instanceMode === 'domain') {
                rules.domainName = [
                    {
                        required: true,
                        message: this.$t('instancePool.domainRequired'),
                        trigger: 'blur'
                    },
                    {
                        validator: (rule, value, callback) => {
                            const error = getDomainValidationError(value);
                            if (error === 'invalid') {
                                callback(new Error(this.$t('instancePool.invalidDomain')));
                                return;
                            }
                            callback();
                        },
                        trigger: 'blur'
                    }
                ];
            }
            return rules;
        },
        instanceIpRules() {
            return [
                {
                    validator: (rule, value, callback) => {
                        this.validateInstanceIp(rule, value, callback);
                    },
                    trigger: 'blur'
                },
                {
                    validator: (rule, value, callback) => {
                        this.validateInstanceIp(rule, value, callback);
                    },
                    trigger: 'change'
                }
            ];
        },
        instancePortRules() {
            return [
                {
                    validator: (rule, value, callback) => {
                        this.validateInstancePort(rule, value, callback);
                    },
                    trigger: 'change'
                },
                {
                    validator: (rule, value, callback) => {
                        this.validateInstancePort(rule, value, callback);
                    },
                    trigger: 'blur'
                }
            ];
        },
        instanceWeightRules() {
            return [
                {
                    validator: (rule, value, callback) => {
                        this.validateInstanceWeight(rule, value, callback);
                    },
                    trigger: 'change'
                },
                {
                    validator: (rule, value, callback) => {
                        this.validateInstanceWeight(rule, value, callback);
                    },
                    trigger: 'blur'
                }
            ];
        }
    },

    data() {
        return {
            deleteAble: false,
            isApplyingPoolData: false,
            instanceErrorMessage: '',
            formData: {
                instanceMode: 'ip',
                domainName: '',
                instances: [createEmptyInstance()]
            }
        };
    },

    methods: {
        applyInstancePoolData(data) {
            this.isApplyingPoolData = true;
            const instances = parseInstancePool(data);
            const { mode, domain } = detectInstanceMode(instances);
            if (mode === 'domain') {
                this.formData.instanceMode = 'domain';
                this.formData.domainName = domain;
                this.formData.instances = [];
                this.deleteAble = false;
            } else {
                this.formData.instanceMode = 'ip';
                this.formData.domainName = '';
                if (instances.length > 0) {
                    this.formData.instances = instances.map(item => toIpFormInstance(item));
                } else {
                    this.formData.instances = [createEmptyInstance()];
                }
                this.deleteAble = this.formData.instances.length > 1;
            }
            this.$nextTick(() => {
                this.isApplyingPoolData = false;
                this.instanceErrorMessage = '';
            });
        },
        handleRemove(index) {
            if (this.formData.instances.length === 2) {
                this.deleteAble = false;
            }
            this.formData.instances.splice(index, 1);
            this.validateInstancesField();
        },
        handleAdd() {
            this.deleteAble = true;
            this.formData.instances.push({
                ip: '',
                ports: { Default: 80 },
                weight: 0
            });
            this.validateInstancesField();
        },
        getInstanceFieldIndex(fieldPath) {
            const match = String(fieldPath || '').match(/^instances\.(\d+)\./);
            return match ? parseInt(match[1], 10) : -1;
        },
        onInstancePortChange(item, key, index) {
            this.$nextTick(() => {
                if (item[key] !== null) {
                    this.$set(item, key, parseInt(item[key], 10));
                }
                this.validateInstanceRow(index);
            });
        },
        onInstanceWeightChange(index) {
            this.$nextTick(() => {
                const item = this.formData.instances[index];
                if (item && item.weight !== null) {
                    this.$set(item, 'weight', parseInt(item.weight, 10));
                }
                this.validateInstanceRow(index);
            });
        },
        validateInstancesField() {
            if (!this.$refs.formData || this.formData.instanceMode !== 'ip') {
                return;
            }
            if (!this.formData.instances.length) {
                this.instanceErrorMessage = this.$t('cluster.tipAtLeastoneInstance');
                return;
            }

            this.$nextTick(() => {
                const form = this.$refs.formData;
                if (!form || this.formData.instanceMode !== 'ip') {
                    return;
                }

                const registeredProps = new Set((form.fields || []).map(field => field.prop));
                const props = [];
                this.formData.instances.forEach((_, index) => {
                    [
                        `instances.${index}.ip`,
                        `instances.${index}.ports.Default`,
                        `instances.${index}.weight`
                    ].forEach(prop => {
                        if (registeredProps.has(prop)) {
                            props.push(prop);
                        }
                    });
                });

                if (!props.length) {
                    this.updateInstanceErrorMessage();
                    return;
                }

                let pending = props.length;
                props.forEach(prop => {
                    form.validateField(prop, () => {
                        pending -= 1;
                        if (pending === 0) {
                            this.updateInstanceErrorMessage();
                        }
                    });
                });
            });
        },
        validateInstanceRow() {
            this.validateInstancesField();
        },
        updateInstanceErrorMessage() {
            if (!this.$refs.formData || this.formData.instanceMode !== 'ip') {
                this.instanceErrorMessage = '';
                return;
            }
            if (!this.formData.instances.length) {
                this.instanceErrorMessage = this.$t('cluster.tipAtLeastoneInstance');
                return;
            }

            const sumError = this.getWeightSumError();
            if (sumError) {
                this.instanceErrorMessage = sumError;
                return;
            }

            this.$nextTick(() => {
                const form = this.$refs.formData;
                if (!form || !form.fields) {
                    this.instanceErrorMessage = '';
                    return;
                }

                let firstError = '';
                form.fields.some(field => {
                    if (
                        field.validateState === 'error'
                        && field.validateMessage
                        && /^instances\.\d+\.(ip|ports\.Default|weight)$/.test(field.prop)
                    ) {
                        firstError = field.validateMessage;
                        return true;
                    }
                    return false;
                });
                this.instanceErrorMessage = firstError;
            });
        },
        validateInstanceIp(rule, value, callback) {
            const index = this.getInstanceFieldIndex(rule.field);
            const ip = String(value || '').trim();

            if (!ip) {
                callback(new Error(this.$t('com.tipEnterX', {
                    obj: this.$t('instancePool.ipAddress')
                })));
                return;
            }
            if (!isIP(ip, 4) && !isIP(ip, 6)) {
                callback(new Error(this.$t('com.tipEnterX', {
                    obj: this.$t('instancePool.ipAddress')
                })));
                return;
            }

            const duplicateError = this.getDuplicateIpError(index);
            if (duplicateError) {
                callback(new Error(duplicateError));
                return;
            }
            callback();
        },
        validateInstancePort(rule, value, callback) {
            if (value == null || value === '' || value < 1 || value > 65535) {
                callback(new Error(this.$t('instancePool.tipPortRang')));
                return;
            }
            callback();
        },
        validateInstanceWeight(rule, value, callback) {
            if (value === null || value === undefined || value === '') {
                callback(new Error(this.$t('instancePool.weightRequired')));
                return;
            }
            if (!NumRegCheck(value) || value < 0 || value > 100) {
                callback(new Error(this.$t('instancePool.weightRangeError')));
                return;
            }
            callback();
        },
        getDuplicateIpError(index) {
            if (index < 0) {
                return '';
            }
            const current = this.formData.instances[index];
            const ip = String((current && current.ip) || '').trim();
            if (!ip) {
                return '';
            }

            const hasDuplicate = this.formData.instances.some((item, itemIndex) => {
                if (itemIndex === index) {
                    return false;
                }
                const otherIp = String(item.ip || '').trim();
                return otherIp && otherIp === ip;
            });
            if (!hasDuplicate) {
                return '';
            }
            return this.$t('instancePool.tipDuplicateIp', { ip });
        },
        getWeightSumError() {
            if (this.formData.instanceMode !== 'ip') {
                return '';
            }
            const weights = this.formData.instances.map(item => {
                const weight = item.weight;
                return weight == null || weight === '' ? NaN : parseInt(weight, 10);
            });
            if (weights.some(weight => Number.isNaN(weight))) {
                return '';
            }
            const sum = weights.reduce((total, weight) => total + weight, 0);
            if (sum !== 100) {
                return this.$t('cluster.weightSumError');
            }
            if (!weights.some(weight => weight > 0)) {
                return this.$t('instancePool.tipAtLeastOnePositiveWeight');
            }
            return '';
        },
        validateIpModePool() {
            const sumError = this.getWeightSumError();
            if (sumError) {
                this.instanceErrorMessage = sumError;
                return false;
            }
            return true;
        },
        emitSubmitData(instances) {
            this.$emit('submitData', {
                topic: 'instancePoolData',
                data: instances.map(item => normalizeInstance(item))
            });
        },
        handleSubmit() {
            if (!this.$refs.formData) {
                return;
            }
            this.$refs.formData.validate(valid => {
                this.updateInstanceErrorMessage();
                if (!valid) {
                    return;
                }
                if (this.formData.instanceMode === 'domain') {
                    const domain = String(this.formData.domainName || '').trim();
                    this.emitSubmitData([buildDomainInstance(domain)]);
                    return;
                }
                if (!this.validateIpModePool()) {
                    return;
                }
                this.emitSubmitData(cloneDeep(this.formData.instances));
            });
        }
    }
};
</script>

<style lang="less" scoped>
.formBox {
    display: inline-block;
    width: 100%;
    table {
        margin: 10px 0;
        width: 100%;
        border-right: 1px solid #d9dbe3;
        border-bottom: 1px solid #d9dbe3;
        th {
            border-left: 1px solid #d9dbe3;
            border-top: 1px solid #d9dbe3;
        }
        td {
            padding: 5px 10px;
            border-left: 1px solid #d9dbe3;
            border-top: 1px solid #d9dbe3;
        }
    }
    .poolInput {
        width: 100px;
        display: inline-block;
    }
    .InputNumber {
        width: 100px;
    }
}

.table-cell-form-item {
    margin-bottom: 0;

    /deep/ .ivu-form-item-content {
        margin-left: 0 !important;
        line-height: normal;
    }
}

.table-cell-form-item-port {
    display: inline-block;
    vertical-align: middle;
}

.instance-error-tip {
    color: #ed4014;
    font-size: 12px;
    line-height: 1.5;
    margin: 4px 0 8px;
}
</style>
