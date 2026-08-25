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
  <div class="provider-view">
    <Card :title="$t('provider.basicInfo')" class="info-card">
      <div class="info-row">
        <span class="info-label">{{ $t('com.name') }}</span>
        <span class="info-value">{{ currentData.name || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">{{ $t('com.desc') }}</span>
        <span class="info-value">{{ currentData.description || '-' }}</span>
      </div>
    </Card>

    <Card :title="$t('instancePool.name')" class="info-card">
      <div class="info-row">
        <span class="info-label">{{ $t('instancePool.instanceMode') }}</span>
        <span class="info-value">{{ instanceModeText }}</span>
      </div>
      <table v-if="instances.length" class="kv-table">
        <thead>
          <tr>
            <th>{{ $t('instancePool.ipAddress') }}</th>
            <th>{{ $t('instancePool.port') }}</th>
            <th>{{ $t('instancePool.weight') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in instances" :key="'inst-' + index">
            <td>{{ item.addr || '-' }}</td>
            <td>{{ item.port }}</td>
            <td>{{ item.weight }}</td>
          </tr>
        </tbody>
      </table>
      <span v-else class="empty-text">-</span>
    </Card>

    <Card :title="$t('gatewayConfig.modelServiceConfig')" class="info-card">
      <div class="info-row">
        <span class="info-label">{{ $t('gatewayConfig.modelProtocol') }}</span>
        <span class="info-value">
          <Tag v-for="item in currentData.model_protocols || []" :key="item">{{ item }}</Tag>
          <span v-if="!(currentData.model_protocols || []).length">-</span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">{{ $t('gatewayConfig.modelListEndpoint') }}</span>
        <span class="info-value">{{ endpointUrl }}</span>
      </div>
    </Card>

    <Card :title="$t('gatewayConfig.serviceAuthKeys')" class="info-card">
      <table v-if="keys.length" class="kv-table">
        <thead>
          <tr>
            <th>{{ $t('gatewayConfig.keyName') }}</th>
            <th>{{ $t('gatewayConfig.keyValue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in keys" :key="'key-' + index">
            <td>{{ item.name || '-' }}</td>
            <td>{{ maskSecretKey(item.key) || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <span v-else class="empty-text">-</span>
    </Card>

    <Card :title="$t('provider.modelList')" class="info-card">
      <div class="info-row">
        <span class="info-label">{{ $t('provider.models') }}</span>
        <span class="info-value">
          <Tag v-for="item in currentData.models || []" :key="item">{{ item }}</Tag>
          <span v-if="!(currentData.models || []).length">-</span>
        </span>
      </div>
    </Card>

    <Card :title="$t('modelPrices.timestamps')" class="info-card">
      <div class="info-row">
        <span class="info-label">{{ $t('modelPrices.createdAt') }}</span>
        <span class="info-value">{{ formatTime(currentData.create_time) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">{{ $t('modelPrices.updatedAt') }}</span>
        <span class="info-value">{{ formatTime(currentData.update_time) }}</span>
      </div>
    </Card>
  </div>
</template>

<script>
import { maskSecretKey } from '@/utils/const';
import {
    detectInstanceMode,
    getInstanceEndpointHosts,
    parseInstancePool,
    syncInstancePoolPortBySchema
} from '@/modules/Clusters/components/InstancePool';

export default {
    name: 'ProviderView',

    props: {
        currentData: {
            type: Object,
            default() {
                return {};
            }
        }
    },

    computed: {
        instances() {
            return parseInstancePool(this.currentData.instance_pool);
        },
        instanceModeText() {
            const { mode } = detectInstanceMode(this.instances);
            return mode === 'domain'
                ? this.$t('instancePool.modeDomain')
                : this.$t('instancePool.modeIp');
        },
        endpointUrl() {
            const endpoint = this.currentData.model_endpoint || {};
            const schema = endpoint.schema || 'https';
            const uri = endpoint.uri || '';
            const host = getInstanceEndpointHosts(
                syncInstancePoolPortBySchema(this.instances, schema)
            )[0] || '';
            return host ? `${schema}://${host}${uri}` : '-';
        },
        keys() {
            return (this.currentData.keys || []).filter(
                item => (item.name && item.name.trim()) || (item.key && item.key.trim())
            );
        }
    },

    methods: {
        maskSecretKey,
        formatTime(ts) {
            if (!ts) {
                return '-';
            }
            const date = new Date(Number(ts) * 1000);
            if (Number.isNaN(date.getTime())) {
                return '-';
            }
            return date.toLocaleString();
        }
    }
};
</script>

<style lang="less" scoped>
.info-card {
    margin-bottom: 16px;
}

.info-row {
    display: flex;
    padding: 8px 0;
    line-height: 22px;
}

.info-label {
    width: 140px;
    color: #808695;
    flex-shrink: 0;
}

.info-value {
    flex: 1;
    word-break: break-all;
}

.kv-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e8eaec;

    th,
    td {
        padding: 8px 12px;
        border: 1px solid #e8eaec;
        text-align: left;
    }

    th {
        background: #f8f8f9;
    }
}

.empty-text {
    color: #999;
}
</style>
