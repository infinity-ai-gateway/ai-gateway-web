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
        <Form
            ref="formData"
            :model="formData"
            :rules="formRules"
            label-position="top"
        >
            <FormItem
                :label="$t('instancePool.instanceMode')"
                prop="instanceMode"
                style="width: 100%;"
            >
                <Select v-model="formData.instanceMode" style="width: 240px;">
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

            <template v-else>
                <FormItem
                    :label="$t('instancePool.list')"
                    prop="instances"
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
                                        :prop="'instances.' + ind + '.addr'"
                                        :rules="instanceAddrRules"
                                        class="table-cell-form-item"
                                    >
                                        <Input
                                            v-model="item.addr"
                                            type="text"
                                            :placeholder="
                                                $t('com.tipEnterX', { obj: $t('instancePool.ipAddress') })
                                            "
                                        />
                                    </FormItem>
                                </td>
                                <td>
                                    <FormItem
                                        :prop="'instances.' + ind + '.port'"
                                        :rules="instancePortRules"
                                        class="table-cell-form-item table-cell-form-item-port"
                                    >
                                        <InputNumber
                                            v-model="item.port"
                                            :max="65535"
                                            :min="1"
                                            class="poolInput"
                                            :placeholder="$t('instancePool.portValue')"
                                            style="width: 80px;"
                                        ></InputNumber>
                                    </FormItem>
                                </td>
                                <td>
                                    <FormItem
                                        :prop="'instances.' + ind + '.weight'"
                                        :rules="instanceWeightRules"
                                        class="table-cell-form-item"
                                    >
                                        <InputNumber
                                            v-model="item.weight"
                                            :max="100"
                                            :min="0"
                                            class="poolInput"
                                            style="width: 80px;"
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
                    <Button plain size="small" type="primary" @click="handleAdd">
                        + {{ $t('com.create') }}
                    </Button>
                </FormItem>
            </template>
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
        addr: '',
        port: 80,
        weight: 100
    };
}

function toFormInstance(instance) {
    const item = instance || {};
    return {
        addr: item.addr != null ? String(item.addr) : '',
        port: item.port != null && item.port !== '' ? parseInt(item.port, 10) : 80,
        weight: item.weight != null && item.weight !== '' ? parseInt(item.weight, 10) : 100,
        name: item.name != null ? String(item.name) : ''
    };
}


export function parseInstancePool(instancePool) {
    if (!instancePool) {
        return [];
    }
    if (Array.isArray(instancePool)) {
        return instancePool.map(item => toFormInstance(item));
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
    const list = (instances || []).map(item => toFormInstance(item));
    if (list.length !== 1) {
        return {
            mode: 'ip',
            domain: ''
        };
    }

    const addr = String(list[0].addr || '').trim();
    if (addr && isHostname(addr) && !isIP(addr, 4) && !isIP(addr, 6)) {
        return {
            mode: 'domain',
            domain: addr
        };
    }

    return {
        mode: 'ip',
        domain: ''
    };
}

export function formatInstanceForApi(instance) {
    const item = toFormInstance(instance);
    const payload = {
        addr: String(item.addr || '').trim(),
        port: parseInt(item.port, 10),
        weight: parseInt(item.weight, 10)
    };
    const name = String(item.name || '').trim();
    if (name) {
        payload.name = name;
    }
    return payload;
}

export function formatInstancePoolForApi(instances) {
    const list = instances || [];
    return list.map(item => formatInstanceForApi(item));
}

export function getInstanceEndpointHosts(instances) {
    return parseInstancePool(instances).map(instance => {
        const addr = String(instance.addr || '').trim();
        if (!addr) {
            return '';
        }
        const port = instance.port != null ? instance.port : 80;
        return `${addr}:${port}`;
    }).filter(Boolean);
}

function buildDomainInstance(domain) {
    const value = String(domain || '').trim();
    return {
        addr: value,
        port: DOMAIN_PORT,
        weight: DOMAIN_WEIGHT
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
        }
    },

    data() {
        const getInstanceFieldIndex = (fieldPath) => {
            const match = String(fieldPath || '').match(/^instances\.(\d+)\./);
            return match ? parseInt(match[1], 10) : -1;
        };

        const getDuplicateAddrError = (index) => {
            if (index < 0) {
                return '';
            }
            const current = this.formData.instances[index];
            const addr = String((current && current.addr) || '').trim();
            if (!addr) {
                return '';
            }

            const hasDuplicate = this.formData.instances.some((item, itemIndex) => {
                if (itemIndex === index) {
                    return false;
                }
                const otherAddr = String(item.addr || '').trim();
                return otherAddr && otherAddr === addr;
            });
            if (!hasDuplicate) {
                return '';
            }
            return this.$t('instancePool.tipDuplicateIp', { ip: addr });
        };

        const validateDomainName = (rule, value, callback) => {
            if (!value) {
                callback(new Error(this.$t('instancePool.domainRequired')));
                return;
            }

            if (!isHostname(value)) {
                callback(new Error(this.$t('instancePool.invalidDomain')));
                return;
            }

            callback();
        };

        const validateInstanceList = (rule, value, callback) => {
            const list = value || [];
            if (!list.length) {
                callback(new Error(this.$t('cluster.tipAtLeastoneInstance')));
                return;
            }

            const weights = list.map(item => {
                const weight = item.weight;
                return weight == null || weight === '' ? NaN : parseInt(weight, 10);
            });
            if (weights.some(weight => Number.isNaN(weight))) {
                callback();
                return;
            }
            const sum = weights.reduce((total, weight) => total + weight, 0);
            if (sum !== 100) {
                callback(new Error(this.$t('cluster.weightSumError')));
                return;
            }
            if (!weights.some(weight => weight > 0)) {
                callback(new Error(this.$t('instancePool.tipAtLeastOnePositiveWeight')));
                return;
            }
            callback();
        };

        const validateInstanceAddr = (rule, value, callback) => {
            const index = getInstanceFieldIndex(rule.field);
            const addr = String(value || '').trim();

            if (!addr) {
                callback(new Error(this.$t('com.tipEnterX', {
                    obj: this.$t('instancePool.ipAddress')
                })));
                return;
            }
            if (!isIP(addr, 4) && !isIP(addr, 6)) {
                callback(new Error(this.$t('com.tipEnterX', {
                    obj: this.$t('instancePool.ipAddress')
                })));
                return;
            }

            const duplicateError = getDuplicateAddrError(index);
            if (duplicateError) {
                callback(new Error(duplicateError));
                return;
            }
            callback();
        };

        const validateInstancePort = (rule, value, callback) => {
            if (value == null || value === '' || value < 1 || value > 65535) {
                callback(new Error(this.$t('instancePool.tipPortRang')));
                return;
            }
            callback();
        };

        const validateInstanceWeight = (rule, value, callback) => {
            if (value === null || value === undefined || value === '') {
                callback(new Error(this.$t('instancePool.weightRequired')));
                return;
            }
            if (!NumRegCheck(value) || value < 0 || value > 100) {
                callback(new Error(this.$t('instancePool.weightRangeError')));
                return;
            }
            callback();
        };

        return {
            deleteAble: false,
            isApplyingPoolData: false,
            formData: {
                instanceMode: 'ip',
                domainName: '',
                instances: [createEmptyInstance()]
            },
            formRules: {
                instanceMode: [
                    {
                        required: true,
                        message: this.$t('com.tipNotEmptyX', { obj: this.$t('instancePool.instanceMode') }),
                        trigger: 'change'
                    }
                ],
                domainName: [
                    {
                        validator: validateDomainName,
                        trigger: 'blur,change'
                    }
                ],
                instances: [
                    {
                        validator: validateInstanceList
                    }
                ]
            },
            instanceAddrRules: [
                {
                    validator: validateInstanceAddr,
                    trigger: 'blur,change'
                }
            ],
            instancePortRules: [
                {
                    validator: validateInstancePort,
                    trigger: 'blur,change'
                }
            ],
            instanceWeightRules: [
                {
                    validator: validateInstanceWeight,
                    trigger: 'blur,change'
                }
            ]
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
                    this.formData.instances = instances.map(item => toFormInstance(item));
                } else {
                    this.formData.instances = [createEmptyInstance()];
                }
                this.deleteAble = this.formData.instances.length > 1;
            }
            this.$nextTick(() => {
                this.isApplyingPoolData = false;
            });
        },

        handleRemove(index) {
            if (this.formData.instances.length === 2) {
                this.deleteAble = false;
            }
            this.formData.instances.splice(index, 1);
        },

        handleAdd() {
            this.deleteAble = true;
            this.formData.instances.push({
                addr: '',
                port: 80,
                weight: 0
            });
        },

        emitSubmitData(instances) {
            this.$emit('submitData', {
                topic: 'instancePoolData',
                data: instances.map(item => toFormInstance(item))
            });
        },

        handleSubmit() {
            if (!this.$refs.formData) {
                return;
            }
            this.$refs.formData.validate(valid => {
                if (!valid) {
                    return;
                }
                if (this.formData.instanceMode === 'domain') {
                    const domain = String(this.formData.domainName || '').trim();
                    this.emitSubmitData([buildDomainInstance(domain)]);
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
</style>
