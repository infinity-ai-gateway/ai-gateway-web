/**
* Copyright(c) 2026 The rainway-ai-gateway Authors. 
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
    <ul :class="[ishandleTitleWidth ? 'bfe-header-isshow' : '', 'bfe-header']">
        <li>
            <Dropdown class="header_box header_name" @on-click="onLangChange">
                <img class="img" src="@/assets/img/language.png" />
                {{ lang === 'zh' ? '简体中文' : 'English' }}
                <DropdownMenu slot="list">
                    <DropdownItem v-for="(tips, key) in langSet" :key="key" :name="key">
                        {{ tips }}
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </li>
        <li :class="{ handleSidebarWidth: true }" @click="handleTitleWidth" class="bfe-header-icon">
            <i class="app-icon app-icon-fold-left app-icon-title"></i>
        </li>
        <li>
            <Dropdown @on-click="userDropdown" class="header_name">
                <Icon type="md-person" />
                {{ user ? user.name : '' }}
                <DropdownMenu slot="list">
                    <DropdownItem name="logout">{{ $t('com.cancellation') }}</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </li>
    </ul>
</template>
<script>
import { setLang, langSet, getLang } from '@/utils/i18n';
export default {
    name: 'headerBar',
    computed: {
        user() {
            return this.$store.getUser();
        }
    },
    mounted() {
        this.lang = getLang();
    },
    data() {
        return {
            ishandleTitleWidth: false,
            langSet,
            lang: 'zh'
        };
    },
    methods: {
        onLangChange(lang) {
            if (this.lang !== lang) {
                location.reload();
                this.$Spin.show();
                this.lang = lang;
                setLang(lang);
                setTimeout(() => {
                    this.$Spin.hide();
                }, 2000);
            }
        },
        handleTitleWidth() {
            this.$emit('headerBar', !this.ishandleTitleWidth);
            this.ishandleTitleWidth = !this.ishandleTitleWidth;
        },
        userDropdown(name) {
            if (name === 'logout') {
                this.$Modal.confirm({
                    title: this.$t('com.informationTips'),
                    content: this.$t('login.tipConfirmLogout'),
                    onOk: () => {
                        this.$request({
                            url: this.$urlFormat('auth/session-keys/{session_key}', {
                                session_key: this.user.sessionKey
                            }),
                            method: 'delete'
                        }).then(res => {
                            if (res.status === 200) {
                                this.$store.removeUserData();
                                this.$router.push({
                                    name: this.$store.getLoginRoute()
                                });
                            }
                        });
                    },
                    onCancel: () => {
                        this.$Message.info({
                            content: this.$t('com.tipCancel')
                        });
                    }
                });
            }
        }
    }
};
</script>
<style lang="less" scoped>
.bfe-header {
    left: 240px;
    transition: margin-left 0.35s ease-in-out, left 0.35s ease-in-out,
        margin-right 0.35s ease-in-out, right 0.35s ease-in-out;
}
.bfe-header-isshow {
    left: 0px;
    .bfe-header-icon {
        transform: rotateY(180deg);
        transition: transform 0.35s;
    }
}
.bfe-header-icon {
    float: left;
}
.app-icon-title {
    color: #000000;
    font-size: 24px;
}
.header_name {
    color: #000000;
}
.header_box {
    position: relative;
    padding-left: 20px;
    .img {
        width: 20px;
        height: 20px;
        position: absolute;
        top: 50%;
        left: -20px;
        transform: translateY(-50%);
    }
}
</style>
