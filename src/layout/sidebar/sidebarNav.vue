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
        <Menu
            :key="menuKey"
            theme="dark"
            width="auto"
            class="menu_list"
            :active-name="menuActiveName"
            @on-select="onSelect"
            v-if="navRoot"
            :open-names="openNames"
            ref="Menu"
        >
            <navItem
                v-for="node in navRoot.children"
                :node="node"
                :key="node.id"
                :name="node.id"
            ></navItem>
        </Menu>
    </div>
</template>

<script>
import navItem from './navItem';
import { NAVIGATION_CANCELLED } from '@/utils/navigation';

export default {
    name: 'sidebarNav',
    components: {
        navItem
    },
    computed: {
        navRoot() {
            return this.$store.getNavRoot();
        }
    },
    data() {
        return {
            menuActiveName: this.$route.name,
            menuKey: 0,
            openNames: []
        };
    },
    mounted() {
        this.openDefauleMenu();
        this.$root.$on(NAVIGATION_CANCELLED, this.resetMenuActive);
    },
    beforeDestroy() {
        this.$root.$off(NAVIGATION_CANCELLED, this.resetMenuActive);
    },
    watch: {
        navRoot() {
            this.openDefauleMenu();
        },
        '$route.name'(name) {
            this.menuActiveName = name;
        }
    },

    methods: {
        resetMenuActive() {
            this.menuActiveName = this.$route.name;
            this.menuKey += 1;
            this.$nextTick(() => {
                this.openDefauleMenu();
            });
        },
        onSelect: function (name) {
            if (this.$route.name !== name) {
                this.$router.push({ name });
            }
        },
        openDefauleMenu() {
            this.openNames = [];
            if (this.navRoot && this.navRoot.children) {
                this.navRoot.children.forEach(item => {
                    this.openNames.push(item.id);
                });
                this.$nextTick(() => {
                    if (this.$refs.Menu && this.$refs.Menu.updateOpened) {
                        this.$refs.Menu.updateOpened();
                    }
                });
            }
        }
    }
};
</script>
<style lang="less" scoped>
/deep/ .ivu-menu-dark.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item-active,
.ivu-menu-dark.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item-active:hover {
    border-right: none;
    color: #fff;
    background: linear-gradient(
        90deg,
        rgba(59, 125, 221, 0.2),
        rgba(59, 125, 221, 0.0875) 60%,
        transparent
    ) !important;
    border-left: 3px solid #515a6e;
    border-left-color: #a0cfff !important;
}
</style>
