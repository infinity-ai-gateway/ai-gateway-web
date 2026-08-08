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
<template>
  <div class="ai-instance-pool">
    <div class="page-toolbar">
      <Button
        v-if="!isEditing"
        type="primary"
        :loading="loading"
        @click="startEdit"
      >{{ $t('com.edit') }}</Button>
    </div>

    <Form
      ref="formData"
      :model="formData"
      label-position="top"
    >
      <FormItem
        :label="$t('instancePool.list')"
        style="width: 100%;"
      >
        <div class="formBox">
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <th>{{ $t('instancePool.machineName') }}</th>
              <th>ip/{{ $t('nav.Domain') }}</th>
              <th>{{ $t('instancePool.port') }}</th>
              <th v-if="isEditing">{{ $t('com.operation') }}</th>
            </tr>
            <tr
              v-if="
                (!formData.instances || formData.instances.length === 0) &&
                  !isEditing
              "
            >
              <td colspan="3" class="empty-cell">{{ $t('entity.noData') }}</td>
            </tr>
            <tr v-for="(item, ind) in formData.instances" :key="ind">
              <td>
                <Input
                  v-if="isEditing"
                  v-model="item.hostname"
                  type="text"
                  :placeholder="
                    $t('com.tipEnterX', { obj: $t('instancePool.machineName') })
                  "
                />
                <span v-else class="cell-text">{{ item.hostname || '-' }}</span>
              </td>
              <td>
                <Input
                  v-if="isEditing"
                  v-model="item.ip"
                  type="text"
                  :placeholder="$t('com.tipEnterX', { obj: 'ip/' + $t('nav.Domain') })"
                />
                <span v-else class="cell-text">{{ item.ip || '-' }}</span>
              </td>
              <td>
                <div v-for="(info, index) in item.ports" :key="index">
                  <template v-if="isEditing">
                    <Input
                      value="Default"
                      class="poolInput"
                      type="text"
                      :placeholder="$t('instancePool.portName')"
                      style="width: 80px;"
                      disabled
                    />：
                    <InputNumber
                      v-model="item.ports.Default"
                      :max="65535"
                      :min="1"
                      class="poolInput"
                      :placeholder="$t('instancePool.portValue')"
                      style="width: 80px;"
                      @on-change="handleNumber(item.ports, 'Default')"
                    ></InputNumber>
                  </template>
                  <span v-else class="cell-text">{{ item.ports.Default || '-' }}</span>
                </div>
              </td>
              <td v-if="isEditing">
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
        <Button
          v-if="isEditing"
          plain
          size="small"
          type="success"
          class="add-btn"
          @click="handleAdd"
        >+ {{ $t('com.create') }}</Button>
      </FormItem>
    </Form>

    <div v-if="isEditing" class="footer-actions">
      <Button size="small" type="primary" @click="handleSubmit">{{
        $t('com.submit')
      }}</Button>
      <Button size="small" @click="cancelEdit">{{
        $t('com.cancel')
      }}</Button>
    </div>

    <Spin v-if="loading" size="large" fix></Spin>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash';
import { isIP, isFQDN } from 'validator';

function createEmptyInstance() {
    return {
        hostname: '',
        ports: { Default: 80 },
        tags: { key: 'value' },
        ip: '',
        weight: 1
    };
}

function normalizeInstance(instance) {
    const item = cloneDeep(instance || {});
    if (item.Name && !item.hostname) {
        item.hostname = item.Name;
    }
    if (item.Addr && !item.ip) {
        item.ip = item.Addr;
    }
    if (item.Hostname && !item.hostname) {
        item.hostname = item.Hostname;
    }
    if (item.Ports && typeof item.Ports === 'object') {
        item.ports = {
            Default: item.Ports.Default != null ? item.Ports.Default : item.Ports.default
        };
    }
    if (item.Port != null && (!item.ports || item.ports.Default == null)) {
        item.ports = { Default: item.Port };
    }
    if (!item.ports || typeof item.ports !== 'object') {
        item.ports = { Default: 80 };
    } else if (item.ports.Default == null || item.ports.Default === '') {
        item.ports.Default = item.ports.default != null ? item.ports.default : 80;
    }
    if (!item.tags) {
        item.tags = { key: 'value' };
    }
    if (item.weight == null) {
        item.weight = 1;
    }
    if (item.hostname == null) {
        item.hostname = '';
    }
    if (item.ip == null) {
        item.ip = '';
    }
    return item;
}

export default {
    data() {
        return {
            formData: {
                instances: []
            },
            loading: false,
            isEditing: false,
            deleteAble: false
        };
    },
    mounted() {
        this.getAlbPool();
    },
    methods: {
        startEdit() {
            if (!this.formData.instances || this.formData.instances.length === 0) {
                this.formData.instances = [createEmptyInstance()];
            }
            this.updateDeleteAble();
            this.isEditing = true;
        },
        cancelEdit() {
            this.isEditing = false;
            this.getAlbPool();
        },
        syncFormData(data) {
            const payload = cloneDeep(data || {});
            payload.instances = (payload.instances || []).map(item => normalizeInstance(item));
            this.formData = payload;
            this.updateDeleteAble();
        },
        updateDeleteAble() {
            this.deleteAble = this.formData.instances && this.formData.instances.length > 1;
        },
        handleRemove(index) {
            this.formData.instances.splice(index, 1);
            this.updateDeleteAble();
        },
        handleAdd() {
            if (!this.formData.instances) {
                this.formData.instances = [];
            }
            this.formData.instances.push(createEmptyInstance());
            this.updateDeleteAble();
        },
        handleNumber(item, key) {
            this.$nextTick(() => {
                if (item[key] !== null) {
                    this.$set(item, key, parseInt(item[key], 10));
                }
            });
        },
        handleSubmit() {
            const tmpData = cloneDeep(this.formData);
            if (!tmpData.instances || tmpData.instances.length < 1) {
                this.$Message.warning({
                    content: this.$t('cluster.tipAtLeastoneInstance')
                });
                return;
            }

            let flag = true;
            tmpData.instances.forEach(ele => {
                const normalized = normalizeInstance(ele);
                Object.assign(ele, normalized);

                if (!ele.hostname) {
                    this.$Message.warning({
                        content: this.$t('com.tipEnterX', {
                            obj: this.$t('instancePool.machineName')
                        })
                    });
                    flag = false;
                }

                if (!ele.ip) {
                    this.$Message.warning({
                        content: this.$t('com.tipEnterX', { obj: 'ip/' + this.$t('nav.Domain') })
                    });
                    flag = false;
                } else if (!isIP(ele.ip, 4) && !isIP(ele.ip, 6) && !isFQDN(ele.ip)) {
                    this.$Message.warning({
                        content: this.$t('com.tipEnterX', { obj: 'ip/' + this.$t('nav.Domain') })
                    });
                    flag = false;
                }

                const port = ele.ports.Default;
                if (port == null || port === '' || port < 1 || port > 65535) {
                    this.$Modal.error({
                        title: this.$t('com.informationTips'),
                        content: `<p>${this.$t('instancePool.tipPortRang')}</p>`
                    });
                    flag = false;
                }
            });

            if (flag) {
                const ipPortSet = new Set();
                for (const ele of tmpData.instances) {
                    const ipPort = `${String(ele.ip).trim()}:${ele.ports.Default}`;
                    if (ipPortSet.has(ipPort)) {
                        this.$Message.warning({
                            content: this.$t('instancePool.tipDuplicateIpPort', { ipPort })
                        });
                        flag = false;
                        break;
                    }
                    ipPortSet.add(ipPort);
                }
            }

            if (!flag) {
                return;
            }

            delete tmpData.name;
            delete tmpData.epp_server;
            this.submitData({ instances: tmpData.instances });
        },
        submitData(data) {
            this.loading = true;
            this.$request({
                url: 'alb-pool',
                method: 'patch',
                data
            }).then(res => {
                if (res && res.status === 200) {
                    this.$Message.success({
                        content: this.$t('com.tipEditSucc')
                    });
                    this.isEditing = false;
                    this.getAlbPool();
                }
            }).catch(err => {
                console.error('更新实例池失败:', err);
            }).finally(() => {
                this.loading = false;
            });
        },
        getAlbPool() {
            this.loading = true;
            this.$request({
                url: 'alb-pool',
                method: 'get'
            }).then(res => {
                if (res.status === 200) {
                    this.syncFormData(res.data.Data || {});
                }
            }).finally(() => {
                this.loading = false;
            });
        }
    }
};
</script>

<style lang="less" scoped>
.ai-instance-pool {
    position: relative;
    min-height: 200px;
}

.page-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.page-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

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
    .empty-cell {
        text-align: center;
        color: #999;
        padding: 24px 10px;
    }
    .cell-text {
        color: #333;
        line-height: 32px;
    }
}

.footer-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 42px;
    padding-top: 8px;
}
</style>
