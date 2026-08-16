/** * Copyright(c) 2026 Beijing Yingfei Networks Technology Co.Ltd. * * Licensed
under the Apache License, Version 2.0 (the "License"); * you may not use this
file except in compliance with the License. * You may obtain a copy of the
License at * * http: //www.apache.org/licenses/LICENSE-2.0 * * Unless required
by applicable law or agreed to in writing, software * distributed under the
License is distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS
OF ANY KIND, either express or implied. * See the License for the specific
language governing permissions and * limitations under the License. */
<template>
  <div class="model-price-import">
    <Form label-position="top">
      <FormItem :label="$t('modelPrices.importMode')">
        <Select v-model="importMode" style="width: 200px;">
          <Option value="replace"
            >replace（{{ $t('modelPrices.replaceMode')





            }}）</Option
          >
          <Option value="merge"
            >merge（{{ $t('modelPrices.mergeMode') }}）</Option
          >
        </Select>
      </FormItem>
      <FormItem :label="$t('modelPrices.yamlFile')">
        <Upload
          ref="upload"
          :action="uploadAction"
          :before-upload="beforeUpload"
          :on-success="onUploadSuccess"
          :on-error="onUploadError"
          :data="uploadData"
          :headers="uploadHeaders"
          :auto-upload="false"
          accept=".yaml,.yml"
        >
          <Button icon="ios-cloud-upload-outline">
            {{ $t('modelPrices.selectYamlFile') }}
          </Button>
        </Upload>
        <p v-if="selectedFile" class="file-name">{{ selectedFile.name }}</p>
      </FormItem>
    </Form>
    <div class="drawer-footer">
      <Button
        type="primary"
        size="small"
        :loading="uploading"
        :disabled="!selectedFile"
        @click="submitImport"
      >
        {{ $t('com.submit') }}
      </Button>
    </div>
    <div v-if="importResult" class="result-section">
      <p>
        {{ $t('modelPrices.importedCount') }}:
        {{ importResult.imported_count }}, {{ $t('modelPrices.skippedCount') }}:
        {{ importResult.skipped_count }}
      </p>
      <div v-if="importResult.errors && importResult.errors.length">
        <p class="error-text">{{ $t('modelPrices.importErrors') }}:</p>
        <ul>
          <li
            v-for="(err, index) in importResult.errors"
            :key="index"
            class="error-text"
          >
            {{ err }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import yaml from 'js-yaml';

export default {
    name: 'ModelPriceImport',

    data() {
        return {
            importMode: 'replace',
            selectedFile: null,
            importResult: null,
            uploading: false
        };
    },

    computed: {
        uploadAction() {
            return `${window.location.protocol}//${window.location.host}/open-api/v1/model-prices/import`;
        },
        uploadData() {
            return { mode: this.importMode };
        },
        uploadHeaders() {
            const user = this.$store && this.$store.getUser ? this.$store.getUser() : null;
            return user && user.sessionKey
                ? { Authorization: `Session ${user.sessionKey}` }
                : {};
        }
    },

    methods: {
        beforeUpload(file) {
            const name = file.name || '';
            const isYaml = name.endsWith('.yaml') || name.endsWith('.yml');
            if (!isYaml) {
                this.$Message.error(this.$t('modelPrices.yamlFileRequired'));
                return false;
            }
            this.selectedFile = file;
            this.importResult = null;
            return false;
        },

        validateYaml(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const doc = yaml.load(e.target.result);
                        if (!doc || typeof doc !== 'object') {
                            reject(new Error(this.$t('modelPrices.parseYamlFailed')));
                            return;
                        }
                        if (!doc.version) {
                            reject(new Error(this.$t('modelPrices.yamlVersionRequired')));
                            return;
                        }
                        if (doc.default_currency !== 'RMB') {
                            reject(new Error(this.$t('modelPrices.currencyMustBeRMB')));
                            return;
                        }
                        resolve();
                    } catch (err) {
                        reject(new Error(this.$t('modelPrices.parseYamlFailed')));
                    }
                };
                reader.onerror = () => {
                    reject(new Error(this.$t('modelPrices.parseYamlFailed')));
                };
                reader.readAsText(file);
            });
        },

        onUploadSuccess(response) {
            this.uploading = false;
            if (response && response.ErrNum === 200) {
                this.importResult = response.Data || {};
                this.$Message.success(this.$t('modelPrices.importSucc'));
                this.$emit('submit');
            } else {
                const msg = response && response.ErrMsg ? response.ErrMsg : this.$t('modelPrices.importFailed');
                this.$Message.error(msg);
            }
        },

        onUploadError(error) {
            this.uploading = false;
            console.error('YAML 导入失败:', error);
            this.$Message.error(this.$t('modelPrices.importFailed'));
        },

        submitImport() {
            if (!this.selectedFile) {
                this.$Message.error(this.$t('modelPrices.yamlFileRequired'));
                return;
            }
            this.uploading = true;
            this.validateYaml(this.selectedFile).then(() => {
                if (this.$refs.upload) {
                    this.$refs.upload.post(this.selectedFile);
                }
            }).catch(err => {
                this.uploading = false;
                this.$Message.error(err.message || this.$t('modelPrices.importFailed'));
            });
        }
    }
};
</script>

<style lang="less" scoped>
.model-price-import {
    .file-name {
        margin-top: 8px;
        color: #515a6e;
    }

    .result-section {
        margin-top: 16px;
    }

    .error-text {
        color: #ed4014;
    }

    .drawer-footer {
        margin-top: 16px;
        text-align: right;
    }
}
</style>
