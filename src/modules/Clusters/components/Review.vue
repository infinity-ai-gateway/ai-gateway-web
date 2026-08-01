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
    <div class="Review">
        <div class="panel">
            <div class="panel-header">{{ $t('cluster.basicConfig') }}</div>
            <div class="panel-body">
                <ul class="clearFloat">
                    <li class="title">
                        {{ this.$t('com.nameX', { obj: this.$t('cluster.name') }) }}:
                    </li>
                    <li class="value">{{ baseConfigData['name'] }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.clusterDescription') }}:</li>
                    <li class="value">{{ baseConfigData['description'] }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.protocol') }}:</li>
                    <li class="value">{{ baseConfigData['protocol'] }}</li>
                </ul>
                <ul v-if="baseConfigData.connection" class="clearFloat">
                    <li class="title">{{ $t('cluster.maxIdleConnPerRs') }}:</li>
                    <li class="value">{{ baseConfigData.connection['max_idle_conn_per_rs'] }}</li>
                </ul>
                <ul v-if="baseConfigData.sticky_sessions" class="clearFloat">
                    <li class="title">{{ $t('cluster.stickySessionsEnabled') }} :</li>
                    <li class="value">
                        {{ baseConfigData.sticky_sessions['enabled'] === 'true' ? $t('com.enable') : $t('com.deactivate') }}
                    </li>
                </ul>
                <ul
                    v-if="
                        baseConfigData.sticky_sessions &&
                        baseConfigData.sticky_sessions['enabled'] === 'true'
                    "
                    class="clearFloat"
                >
                    <li class="title">{{ $t('cluster.hashStrategy') }} :</li>
                    <li class="value">{{ baseConfigData.sticky_sessions['hash_strategy'] }}</li>
                </ul>
                <ul
                    v-if="
                        baseConfigData.sticky_sessions &&
                        baseConfigData.sticky_sessions['enabled'] === 'true' &&
                        baseConfigData.sticky_sessions['hash_strategy'] !== 'CLIENT_IP_ONLY'
                    "
                    class="clearFloat"
                >
                    <li class="title">{{ $t('cluster.hashHeader') }} :</li>
                    <li class="value">{{ baseConfigData.sticky_sessions['hash_header'] }}</li>
                </ul>
                <ul v-if="baseConfigData.buffers" class="clearFloat">
                    <li class="title">{{ $t('cluster.reqWriteBufferSize') }} :</li>
                    <li class="value">{{ baseConfigData.buffers['req_write_buffer_size'] }}</li>
                </ul>
                <ul v-if="baseConfigData.connection" class="clearFloat">
                    <li class="title">{{ $t('cluster.cancelOnClientClose') }}:</li>
                    <li class="value">
                        {{
                            baseConfigData.connection['cancel_on_client_close'] === 'true'
                                ? $t('com.enable')
                                : $t('com.deactivate')
                        }}
                    </li>
                </ul>
            </div>
        </div>
        <div class="panel">
            <div class="panel-header">{{ $t('cluster.timeoutAndRetransmission') }}</div>
            <div v-if="baseConfigData.timeouts && baseConfigData.retries" class="panel-body">
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.timeoutReadClientAgain') }}:</li>
                    <li class="value">{{ baseConfigData.timeouts.timeout_read_client_again }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.timeoutReadbodyClient') }} :</li>
                    <li class="value">{{ baseConfigData.timeouts.timeout_readbody_client }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.timeoutConnServ') }} :</li>
                    <li class="value">{{ baseConfigData.timeouts.timeout_conn_serv }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.timeoutResHeader') }} :</li>
                    <li class="value">{{ baseConfigData.timeouts.timeout_response_header }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.timeoutWriteClient') }} :</li>
                    <li class="value">{{ baseConfigData.timeouts.timeout_write_client }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.maxRetryInCluster') }} :</li>
                    <li class="value">{{ baseConfigData.retries.max_retry_in_cluster }}</li>
                </ul>
            </div>
        </div>
        <div class="panel">
            <div class="panel-header">{{ $t('cluster.passiveHealthCheck') }}</div>
            <div class="panel-body">
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.faultThreshold') }} :</li>
                    <li class="value">{{ displayPassiveHealthData.failnum }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.healthCheckInterval') }}:</li>
                    <li class="value">{{ displayPassiveHealthData.interval }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.healthCheckHost') }}:</li>
                    <li class="value">{{ displayPassiveHealthData.host || '-' }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.healthCheckUri') }}:</li>
                    <li class="value">{{ displayPassiveHealthData.uri }}</li>
                </ul>
                <ul class="clearFloat">
                    <li class="title">{{ $t('cluster.healthCheckStatuscode') }} :</li>
                    <li class="value">{{ displayPassiveHealthData.statuscode }}</li>
                </ul>
            </div>
        </div>
        <div class="panel">
            <div class="panel-header">{{ $t('instancePool.config') }}</div>
            <div class="panel-body">
                <ul class="clearFloat">
                    <li class="title">{{ $t('instancePool.instanceMode') }}:</li>
                    <li class="value">{{ instanceModeText }}</li>
                </ul>
                <ul v-if="isDomainMode" class="clearFloat">
                    <li class="title">{{ $t('instancePool.domain') }}:</li>
                    <li class="value">{{ providerDomain || '-' }}</li>
                </ul>
                <ul v-if="isDomainMode" class="clearFloat">
                    <li class="title">{{ $t('instancePool.weight') }}:</li>
                    <li class="value">100</li>
                </ul>
                <ul v-else class="clearFloat detail-row detail-row-block instance-ip-list-row">
                    <li class="title">{{ $t('instancePool.list') }}:</li>
                    <li class="value">
                        <pageTable :columns="ipColumns" :tableData="instancePoolUsed" />
                    </li>
                </ul>
            </div>
        </div>
        <!-- 大模型 -->
        <div class="panel">
            <div class="panel-header">{{ $t('llmConfig.title') }}</div>
            <div class="panel-body" v-if="llmConfigData">
                <ul class="clearFloat">
                        <li class="title">{{ $t('gatewayConfig.modelServiceProvider') }}:</li>
                        <li class="value">{{ providerTypeText }}</li>
                    </ul>
                    <ul class="clearFloat">
                        <li class="title">{{ $t('gatewayConfig.modelListEndpoint') }}:</li>
                        <li class="value">
                            <p>
                                {{ endpointSchema }}://{{ ipStr }}{{ endpointUri }}
                            </p>
                            <p>header: {{ displayEndpointHeaders }}</p>
                        </li>
                    </ul>
                    <ul class="clearFloat detail-row">
                        <li class="title">{{ $t('llmConfig.models') }}:</li>
                        <li class="value">
                            <template v-if="displayModels.length">
                                <span
                                    v-for="model in displayModels"
                                    :key="model"
                                    class="model-tag"
                                >{{ model }}</span>
                            </template>
                            <span v-else class="empty-text">-</span>
                        </li>
                    </ul>
                    <ul class="clearFloat detail-row detail-row-block">
                        <li class="title">{{ $t('llmConfig.modelRedirect') }}:</li>
                        <li class="value">
                            <table v-if="displayModelMappings.length" class="mapping-table">
                                <thead>
                                    <tr>
                                        <th>{{ $t('llmConfig.originalModelName') }}</th>
                                        <th>{{ $t('llmConfig.backendModelName') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(item, index) in displayModelMappings"
                                        :key="index"
                                    >
                                        <td>{{ item.source_model }}</td>
                                        <td>{{ item.target_model }}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <span v-else class="empty-text">-</span>
                        </li>
                    </ul>
                    <ul class="clearFloat">
                        <li class="title">{{ $t('llmConfig.serviceAuthKey') }}:</li>
                        <li class="value">{{ maskedServiceAuthKey }}</li>
                    </ul>
            </div>
        </div>
    </div>
</template>
<script>
import pageTable from '@/components/table/pageTable';
import { parseInstancePool, detectInstanceMode, getInstanceEndpointHosts } from './InstancePool';
import { formatPassiveHealthCheckForApi } from './PassiveHealthCheck';
import { maskSecretKey } from '@/utils/const';
export default {
    name: 'Review',

    components: { pageTable },

    props: {
        baseConfigData: {
            type: Object,
            required: true
        },
        passiveHealthData: {
            type: Object,
            required: true
        },
        instancePoolData: {
            type: Array,
            required: true
        },
        llmConfigData: {
            type: Object
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
        showFooter: {
            type: Boolean,
            default: true
        },
        isAdd: {
            type: Boolean,
            default: true
        },
        reportFlag: {
            type: Boolean
        }
    },
    mounted() {
        this.getProviders();
    },
    watch: {
        instancePoolData: {
            handler(v) {
                const pool = Array.isArray(v) ? v : parseInstancePool(v);
                this.instancePoolUsed = parseInstancePool(pool);
                const { mode, domain } = detectInstanceMode(
                    this.instancePoolUsed.length ? this.instancePoolUsed : pool
                );
                this.instanceMode = mode;
                this.providerDomain = domain;
                this.ipStr = getInstanceEndpointHosts(
                    this.instancePoolUsed.length ? this.instancePoolUsed : pool
                ).join('\n');
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
        return {
            instancePoolUsed: [],
            instanceMode: 'ip',
            providerDomain: '',
            spinShow: false,
            productName: '',
            ipStr: '',
            providers: []
        };
    },
    computed: {
        providerTypeText() {
            const providerType = this.llmConfigData && this.llmConfigData.provider_type;
            if (!providerType) {
                return '-';
            }
            const provider = this.providers.find(item => item.id === providerType);
            return provider ? provider.name : providerType;
        },
        isDomainMode() {
            return this.instanceMode === 'domain';
        },
        instanceModeText() {
            return this.isDomainMode
                ? this.$t('instancePool.modeDomain')
                : this.$t('instancePool.modeIp');
        },
        ipColumns() {
            return [
                {
                    title: this.$t('instancePool.ipAddress'),
                    key: 'ip'
                },
                {
                    title: this.$t('instancePool.port'),
                    key: 'port',
                    render(h, params) {
                        const ports = params.row.ports || {};
                        return h('span', ports.Default != null ? String(ports.Default) : '-');
                    }
                },
                {
                    title: this.$t('instancePool.weight'),
                    key: 'weight'
                }
            ];
        },
        displayPassiveHealthData() {
            return formatPassiveHealthCheckForApi(this.passiveHealthData);
        },
        endpointSchema() {
            const endpoint = this.llmConfigData && this.llmConfigData.model_endpoint;
            return (endpoint && endpoint.schema) || 'https';
        },
        endpointUri() {
            const endpoint = this.llmConfigData && this.llmConfigData.model_endpoint;
            return (endpoint && endpoint.uri) || '/v1/models';
        },
        displayModels() {
            const models = this.llmConfigData && this.llmConfigData.models;
            if (!Array.isArray(models)) {
                return [];
            }
            return models
                .map(model => {
                    if (model && typeof model === 'object') {
                        return model.id || model.name || model.value || '';
                    }
                    return model;
                })
                .filter(model => model !== '' && model !== null && model !== undefined);
        },
        displayModelMappings() {
            const mappings = this.llmConfigData && this.llmConfigData.model_mappings;
            if (!Array.isArray(mappings)) {
                return [];
            }
            return mappings.filter(item => item && (item.source_model || item.target_model));
        },
        maskedServiceAuthKey() {
            const key = this.llmConfigData && this.llmConfigData.key;
            if (!key) {
                return '-';
            }
            if (this.originalLlmConfigKey && key === this.originalLlmConfigKey) {
                return maskSecretKey(key);
            }
            return key;
        },
        displayEndpointHeaders() {
            const headers =
                this.llmConfigData &&
                this.llmConfigData.model_endpoint &&
                this.llmConfigData.model_endpoint.headers;
            if (!headers || typeof headers !== 'object' || !Object.keys(headers).length) {
                return '-';
            }
            const originalHeaders = this.originalLlmConfigHeaders || {};
            return Object.keys(headers)
                .map(key => {
                    const value = headers[key];
                    const displayValue =
                        originalHeaders[key] != null && value === originalHeaders[key]
                            ? maskSecretKey(value)
                            : value;
                    return `${key}: ${displayValue}`;
                })
                .join('; ');
        }
    },
    methods: {
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
        handleSubmit() {
            this.$emit('submitData');
        }
    }
};
</script>
<style lang="less" scoped>
.com-btn-box {
    margin-top: 15px;
}

.Review {
    .panel-body ul.clearFloat {
        display: flex;
        align-items: center;
        line-height: 22px;
        padding: 6px 0;
        min-height: 30px;

        &::after {
            display: none;
        }

        .title {
            float: none;
            width: 200px;
            flex-shrink: 0;
            text-align: right;
            white-space: normal;
            overflow: visible;
        }

        .value {
            float: none;
            flex: 1;
            padding-left: 16px;
            min-width: 0;
            word-break: break-word;
        }
    }

    .panel-body ul.clearFloat.detail-row-block,
    .panel-body ul.clearFloat.instance-ip-list-row {
        align-items: flex-start;
    }

    .detail-row-block {
        .title {
            padding-top: 8px;
        }
    }

    .instance-ip-list-row {
        .value {
            /deep/ .page-table {
                margin-top: 0;
            }

            /deep/ .page-table .page {
                margin-top: 12px;
            }
        }
    }
}

.model-tag {
    display: inline-block;
    margin: 0 8px 8px 0;
    padding: 2px 10px;
    background: #ecf5ff;
    border: 1px solid #d9ecff;
    border-radius: 3px;
    color: #409eff;
    font-size: 12px;
    line-height: 20px;
}

.empty-text {
    color: #999;
}

.mapping-table {
    width: auto;
    min-width: 420px;
    max-width: 100%;
    border-collapse: collapse;
    border: 1px solid #e7e9f0;
    margin: 0;

    th,
    td {
        padding: 8px 16px;
        text-align: left;
        border: 1px solid #e7e9f0;
        font-size: 13px;
        line-height: 20px;
        word-break: break-all;
    }

    th {
        background: #f8f8f9;
        color: #515a6e;
        font-weight: 500;
    }

    td {
        color: #333;
        background: #fff;
    }
}
</style>
