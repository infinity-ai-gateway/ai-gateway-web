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
        <Form ref="formData" :model="formData" :rules="ruleValidate" label-position="top">
            <FormItem :label="$t('com.nameX', { obj: $t('cert.name') })" prop="cert_name">
                <Input
                    v-model="formData.cert_name"
                    type="text"
                    :placeholder="
                        $t('com.tipRequiredX', { obj: $t('com.nameX', { obj: $t('cert.name') }) })
                    "
                    class="com-create-input"
                />
            </FormItem>
            <FormItem :label="$t('com.desc')" prop="description">
                <Input
                    v-model="formData.description"
                    type="textarea"
                    :placeholder="$t('com.tipRequiredX', { obj: $t('com.desc') })"
                    class="com-create-input"
                />
            </FormItem>
            <FormItem :label="$t('cert.certFile')" prop="cert_file_content">
                <Upload
                    :before-upload="handleUploadCer"
                    action="//jsonplaceholder.typicode.com/posts/"
                >
                    <Button>{{ $t('cert.selectFile') }}</Button>
                    <span v-if="certFileName !== ''"
                        >{{ $t('com.nameX', { obj: $t('cert.file') }) }}：
                        {{ certFileName }}
                    </span>
                </Upload>
            </FormItem>
            <FormItem :label="$t('cert.privateKeyFile')" prop="key_file_content">
                <Upload
                    :before-upload="handleUploadKey"
                    action="//jsonplaceholder.typicode.com/posts/"
                >
                    <Button>{{ $t('cert.selectFile') }}</Button>
                    <span v-if="keyFileName !== ''"
                        >{{ $t('com.nameX', { obj: $t('cert.file') }) }}：
                        {{ keyFileName }}
                    </span>
                </Upload>
            </FormItem>
            <FormItem :label="$t('cert.expiredDate')">
                <span :class="{ 'cert-expired-placeholder': !expiredDatePreview }">
                    {{ expiredDatePreview || $t('cert.tipExpiredDatePending') }}
                </span>
            </FormItem>
            <FormItem :label="$t('cert.isDefault')">
                <Checkbox v-model="formData.is_default" :disabled="defaultIsDefault"></Checkbox>
            </FormItem>
        </Form>
        <div class="drawer-footer">
            <Button size="small" type="primary" @click="handleSubmit('formData')">{{
                $t('com.submit')
            }}</Button>
            <Button size="small" class="com-create-btn" @click="handleReset()">{{
                $t('com.reset')
            }}</Button>
        </div>
        <Spin v-if="spinShow" size="large" fix></Spin>
    </div>
</template>

<script>
import { CertNameRegCheck, CertDescriptionRegCheck } from '@/utils/const';
import { parseCertExpiredDate } from '@/utils/cert';
export default {
    props: {
        defaultIsDefault: {
            type: Boolean,
            default: false
        }
    },
    data() {
        const validateCertName = (rule, value, callback) => {
            if (value === '') {
                callback(
                    new Error(
                        this.$t('com.tipEnterX', {
                            obj: this.$t('com.nameX', { obj: this.$t('cert.name') })
                        })
                    )
                );
                return;
            }
            if (CertNameRegCheck(value)) {
                callback(new Error(this.$t('cert.tipCertNameRule')));
                return;
            }
            callback();
        };
        const validateDescription = (rule, value, callback) => {
            if (value === '') {
                callback(
                    new Error(this.$t('com.tipEnterX', { obj: this.$t('com.desc') }))
                );
                return;
            }
            if (CertDescriptionRegCheck(value)) {
                callback(new Error(this.$t('cert.tipDescriptionRule')));
                return;
            }
            callback();
        };
        const validateCertFile = (rule, value, callback) => {
            if (!value) {
                callback(
                    new Error(this.$t('com.tipUploadX', { obj: this.$t('cert.certFile') }))
                );
                return;
            }
            callback();
        };
        const validateKeyFile = (rule, value, callback) => {
            if (!value) {
                callback(
                    new Error(this.$t('com.tipUploadX', { obj: this.$t('cert.privateKeyFile') }))
                );
                return;
            }
            callback();
        };
        return {
            certFileName: '',
            keyFileName: '',
            expiredDatePreview: '',
            spinShow: false,
            formData: {
                is_default: false,
                cert_name: '',
                description: '',
                key_file_content: '',
                cert_file_content: ''
            },
            ruleValidate: {
                cert_name: [{ required: true, validator: validateCertName, trigger: 'blur' }],
                description: [{ required: true, validator: validateDescription, trigger: 'blur' }],
                cert_file_content: [{ required: true, validator: validateCertFile, trigger: 'change' }],
                key_file_content: [{ required: true, validator: validateKeyFile, trigger: 'change' }]
            }
        };
    },
    mounted() {
        this.formData.is_default = this.defaultIsDefault;
    },
    methods: {
        changeFile(objFile) {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsText(objFile, 'UTF-8');
                reader.onload = function (e) {
                    const fileString = e.target.result;
                    resolve(fileString);
                };
            });
        },
        handleUploadCer(file) {
            this.formData.cert_file_content = file;
            this.certFileName = file.name;
            this.expiredDatePreview = '';
            this.changeFile(file).then((pemContent) => {
                this.expiredDatePreview = parseCertExpiredDate(pemContent) || '';
            });
            this.$nextTick(() => {
                if (this.$refs.formData) {
                    this.$refs.formData.validateField('cert_file_content');
                }
            });
            return false;
        },
        handleUploadKey(file) {
            this.formData.key_file_content = file;
            this.keyFileName = file.name;
            this.$nextTick(() => {
                if (this.$refs.formData) {
                    this.$refs.formData.validateField('key_file_content');
                }
            });
            return false;
        },
        handleSubmit(name) {
            this.$refs[name].validate(async valid => {
                if (valid) {
                    const tmpData = {
                        cert_name: this.formData.cert_name,
                        description: this.formData.description,
                        is_default: this.formData.is_default,
                        key_file_content: await this.changeFile(this.formData.key_file_content),
                        cert_file_content: await this.changeFile(this.formData.cert_file_content)
                    };
                    this.$emit('submit', tmpData);
                }
            });
        },
        handleReset() {
            this.keyFileName = '';
            this.certFileName = '';
            this.expiredDatePreview = '';
            if (this.$refs.formData) {
                this.$refs.formData.resetFields();
            }
            this.formData.is_default = this.defaultIsDefault;
        }
    }
};
</script>
<style lang="less" scoped>
.cert-expired-placeholder {
    color: #c5c8ce;
}
</style>
