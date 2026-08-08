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
    <div>
        <Modal v-model="modal" :closable="false" :mask-closable="false" :width="width">
            <p slot="header" style="line-height: 30px; height: 50px;">
                <Icon v-if="!title" size="28" style="color: #ff9900;" type="ios-help-circle"></Icon>
                <span style="font-size: 16px; margin-left: 12px;">{{
                    title ? title : $t('com.informationTips')
                }}</span>
            </p>
            <p style="white-space: pre-line;">{{ content }}</p>
            <slot />
            <div slot="footer" v-if="oneButton" class="df justify-center">
                <Button type="primary" @click="confirm">{{
                    okText ? okText : $t('com.confirm')
                }}</Button>
            </div>
            <div slot="footer" v-else>
                <Button @click="cancel" :disabled="disableCancel">{{ myCancelText }}</Button>
                <Button
                    type="primary"
                    :loading="loading"
                    @click="confirm"
                    :disabled="disableConfirm"
                    >{{ okText ? okText : $t('com.confirm') }}</Button
                >
            </div>
        </Modal>
    </div>
</template>

<script>
export default {
    props: {
        content: {
            type: String,
            default: ''
        },
        loading: {
            type: Boolean,
            default: false
        },
        modal: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        okText: {
            type: String,
            default: ''
        },
        disableConfirm: {
            type: Boolean,
            default: false
        },
        cancelText: {
            type: String,
            default: ''
        },
        width: {
            type: String,
            default: '30%'
        },
        oneButton: {
            type: Boolean,
            default: false
        },
        disableCancel: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            myCancelText: this.cancelText || this.$t('com.cancel')
        };
    },
    watch: {
        cancelText(newVal) {
            this.myCancelText = newVal;
        }
    },
    methods: {
        confirm() {
            this.$emit('onOk');
        },
        cancel() {
            this.$emit('onCancel');
        }
    }
};
</script>

<style lang="less" scoped>
/deep/ .ivu-modal-header {
    height: 50px;
}
/deep/ .ivu-modal-content .ivu-modal-body {
    word-wrap: break-word;
}
/deep/ .ivu-modal-footer {
    border: none;
}
</style>
