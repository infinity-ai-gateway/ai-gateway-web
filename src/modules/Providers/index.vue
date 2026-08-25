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
  <div class="providers">
    <Button type="primary" size="small" @click="onAdd">
      {{ $t('com.createX', { obj: $t('provider.name') }) }}
    </Button>
    <pageTable
      :tableData="tableData"
      :columns="columns"
      :loading="tableLoading"
      :total="total"
      :server-pagination="true"
      :current-page="page"
      :page-size="pageSize"
      @on-page-change="onPageChange"
      @on-search-change="onSearchChange"
    />

    <Drawer
      v-model="upsertVisible"
      :title="drawerTitle"
      :mask-closable="false"
      width="65"
    >
      <ProviderUpsert
        v-if="upsertVisible && !isView"
        :currentProvider="currentProvider"
        :providerNames="providerNames"
        :isAdd="isAdd"
        @submit="onUpsertSubmit"
        @models-synced="onModelsSynced"
      />
      <ProviderView v-if="upsertVisible && isView" :currentData="currentProvider" />
    </Drawer>
  </div>
</template>

<script>
import pageTable from '@/components/table/pageTable';
import ProviderUpsert from './components/ProviderUpsert.vue';
import ProviderView from './components/ProviderView.vue';

const PROTOCOL_OPTIONS = [
    { value: 'openai', label: 'openai' },
    { value: 'anthropic', label: 'anthropic' }
];

export default {
    name: 'Providers',

    components: {
        pageTable,
        ProviderUpsert,
        ProviderView
    },

    data() {
        return {
            tableLoading: false,
            tableData: [],
            page: 1,
            pageSize: 20,
            total: 0,
            searchParams: {},
            upsertVisible: false,
            isAdd: true,
            isView: false,
            currentProvider: {},
            providerNames: []
        };
    },

    computed: {
        drawerTitle() {
            if (this.isView) {
                return this.$t('com.detail');
            }
            return this.isAdd
                ? this.$t('com.createX', { obj: this.$t('provider.name') })
                : this.$t('com.editX', { obj: this.$t('provider.name') });
        },
        columns() {
            const that = this;
            return [
                {
                    title: this.$t('com.name'),
                    key: 'name',
                    sortable: 'custom',
                    searchable: true
                },
                {
                    title: this.$t('com.desc'),
                    key: 'description',
                    searchable: true
                },
                {
                    title: this.$t('provider.protocols'),
                    key: 'model_protocols',
                    searchable: true,
                    searchType: 'select',
                    searchFilters: PROTOCOL_OPTIONS,
                    render(h, params) {
                        return h('span', (params.row.model_protocols || []).join(', ') || '-');
                    }
                },
                {
                    title: this.$t('provider.models'),
                    key: 'models',
                    searchable: true,
                    render(h, params) {
                        return h('span', (params.row.models || []).join(', ') || '-');
                    }
                },
                {
                    title: this.$t('com.operation'),
                    key: 'action',
                    render(h, params) {
                        return h('div', [
                            h(
                                'Button',
                                {
                                    props: { type: 'success', size: 'small' },
                                    style: { marginRight: '5px' },
                                    on: { click: () => that.onDetails(params.row) }
                                },
                                that.$t('com.detail')
                            ),
                            h(
                                'Button',
                                {
                                    props: { type: 'primary', size: 'small' },
                                    style: { marginRight: '5px' },
                                    on: { click: () => that.onEdit(params.row) }
                                },
                                that.$t('com.edit')
                            ),
                            h(
                                'Button',
                                {
                                    props: { type: 'error', size: 'small' },
                                    on: { click: () => that.onDel(params.row) }
                                },
                                that.$t('com.del')
                            )
                        ]);
                    }
                }
            ];
        }
    },

    mounted() {
        this.fetchNameList();
        this.fetchList();
    },

    methods: {
        parseListPayload(data) {
            if (Array.isArray(data)) {
                return { list: data, total: data.length };
            }
            const payload = data || {};
            const list = Array.isArray(payload.list) ? payload.list : [];
            const pagination = payload.pagination || {};
            return {
                list,
                total: pagination.total != null ? pagination.total : list.length,
                page: pagination.page,
                pageSize: pagination.page_size
            };
        },
        fetchList() {
            this.tableLoading = true;
            this.$request({
                url: 'providers',
                method: 'get',
                params: {
                    page: this.page,
                    page_size: this.pageSize,
                    ...this.searchParams
                },
                openapi: true
            })
                .then(res => {
                    if (res.status !== 200) {
                        return;
                    }
                    const parsed = this.parseListPayload(res.data.Data);
                    if (parsed.list.length === 0 && this.page > 1) {
                        this.page -= 1;
                        return this.fetchList();
                    }
                    this.tableData = parsed.list;
                    this.total = parsed.total;
                    if (parsed.page != null) {
                        this.page = parsed.page;
                    }
                    if (parsed.pageSize != null) {
                        this.pageSize = parsed.pageSize;
                    }
                })
                .finally(() => {
                    this.tableLoading = false;
                });
        },
        fetchNameList() {
            this.$request({
                url: 'providers',
                method: 'get',
                params: { page: 1, page_size: 1000 },
                openapi: true
            }).then(res => {
                if (res.status !== 200) {
                    return;
                }
                const parsed = this.parseListPayload(res.data.Data);
                this.providerNames = parsed.list.map(item => item.name);
            });
        },
        onPageChange(pageInfo) {
            this.page = pageInfo.page;
            this.pageSize = pageInfo.pageSize;
            this.fetchList();
        },
        onSearchChange(filters) {
            const params = {};
            const protocol = filters && filters.model_protocols;
            if (protocol) {
                params.model_protocol = protocol;
            }
            this.searchParams = params;
            this.page = 1;
            this.fetchList();
        },
        onAdd() {
            this.isAdd = true;
            this.isView = false;
            this.currentProvider = {};
            this.upsertVisible = true;
        },
        onEdit(row) {
            this.isAdd = false;
            this.isView = false;
            this.loadDetail(row.name, () => {
                this.upsertVisible = true;
            });
        },
        onDetails(row) {
            this.isView = true;
            this.isAdd = false;
            this.loadDetail(row.name, () => {
                this.upsertVisible = true;
            });
        },
        loadDetail(name, done) {
            this.$request({
                url: this.$urlFormat('providers/{provider_name}', {
                    provider_name: name
                }),
                method: 'get',
                openapi: true
            })
                .then(res => {
                    this.currentProvider =
                        res.status === 200 && res.data.Data ? res.data.Data : { name };
                    if (typeof done === 'function') {
                        done();
                    }
                })
                .catch(() => {
                    this.currentProvider = { name };
                    if (typeof done === 'function') {
                        done();
                    }
                });
        },
        onDel(row) {
            this.$Modal.confirm({
                title: this.$t('com.informationTips'),
                content: this.$t('com.confirmDel') + row.name,
                loading: true,
                onOk: () => {
                    this.$request({
                        url: this.$urlFormat('providers/{provider_name}', {
                            provider_name: row.name
                        }),
                        method: 'delete',
                        openapi: true,
                        unneedTips: true
                    })
                        .then(res => {
                            this.$Modal.remove();
                            if (res.status === 200) {
                                this.$Message.success({ content: this.$t('com.tipDelSucc') });
                                this.fetchNameList();
                                this.fetchList();
                                return;
                            }
                            const msg =
                                (res.data && res.data.ErrMsg) || this.$t('provider.deleteFailed');
                            this.$Message.error(msg);
                        })
                        .catch(err => {
                            this.$Modal.remove();
                            const msg =
                                (err && err.data && err.data.ErrMsg) ||
                                this.$t('provider.deleteFailed');
                            this.$Message.error(msg);
                        });
                }
            });
        },
        onUpsertSubmit() {
            this.upsertVisible = false;
            this.fetchNameList();
            this.fetchList();
        },
        onModelsSynced() {
            this.fetchList();
        }
    }
};
</script>

<style lang="less" scoped>
.providers {
    .ivu-btn {
        margin-bottom: 12px;
    }
}
</style>
