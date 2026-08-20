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
            <FormItem :label="$t('cert.expiredDate')" prop="expired_date">
                <DatePicker
                    v-model="formData.expired_date"
                    type="date"
                    :placeholder="$t('com.tipSelectX', { obj: $t('cert.expiredDate') })"
                    @on-change="validateExpiredDateField"
                ></DatePicker>
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
            <FormItem label="IsDefault：">
                <Checkbox v-model="formData.is_default"></Checkbox>
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
import { CertNameRegCheck } from '@/utils/const';
export default {
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
        const validateExpiredDate = (rule, value, callback) => {
            if (value === '' || value === null || value === undefined) {
                callback(
                    new Error(this.$t('com.tipSelectX', { obj: this.$t('cert.expiredDate') }))
                );
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
            spinShow: false,
            formData: {
                is_default: false,
                cert_name: '',
                description: '',
                expired_date: '',
                key_file_content: '',
                cert_file_content: ''
            },
            ruleValidate: {
                cert_name: [{ required: true, validator: validateCertName, trigger: 'blur' }],
                description: [
                    {
                        required: true,
                        message: this.$t('com.tipEnterX', { obj: this.$t('com.desc') }),
                        trigger: 'blur'
                    }
                ],
                expired_date: [{ required: true, validator: validateExpiredDate, trigger: 'change' }],
                cert_file_content: [{ required: true, validator: validateCertFile, trigger: 'change' }],
                key_file_content: [{ required: true, validator: validateKeyFile, trigger: 'change' }]
            }
        };
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
        validateExpiredDateField() {
            this.$nextTick(() => {
                if (this.$refs.formData) {
                    this.$refs.formData.validateField('expired_date');
                }
            });
        },
        handleSubmit(name) {
            this.$refs[name].validate(async valid => {
                if (valid) {
                    const tmpData = {
                        expired_date: this.formData.expired_date,
                        cert_name: this.formData.cert_name,
                        description: this.formData.description,
                        is_default: this.formData.is_default,
                        cert_file_name: this.certFileName,
                        key_file_name: this.keyFileName,
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
            if (this.$refs.formData) {
                this.$refs.formData.resetFields();
            }
        }
    }
};
</script>
