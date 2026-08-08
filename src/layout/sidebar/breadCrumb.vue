<!--
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
-->
<!--
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
-->
<template>
    <Breadcrumb class="bfe-breadcrumb" v-if="user && nav">
        <BreadcrumbItem v-if="breadcrumbRouteName">
            <span class="breadcrumb-link" @click="handleBack">
                {{ $t(`nav.${nav.text}`) }}
            </span>
        </BreadcrumbItem>
        <BreadcrumbItem v-if="breadcrumbTitle">
            {{ breadcrumbTitle }}
        </BreadcrumbItem>
        <BreadcrumbItem v-else>
            {{ $t(`nav.${nav.text}`) }}
        </BreadcrumbItem>
    </Breadcrumb>
</template>
<script>
export default {
    name: 'breadCrumb',

    computed: {
        user() {
            return this.$store.getUser();
        },
        nav() {
            return this.$store.findNav(this.$route.name);
        },
        breadcrumbTitle() {
            if (!this.isBreadcrumbActive) {
                return '';
            }
            return this.$store.getBreadcrumbTitle();
        },
        breadcrumbRouteName() {
            if (!this.isBreadcrumbActive) {
                return '';
            }
            return this.$store.getBreadcrumbRouteName();
        },
        isBreadcrumbActive() {
            const routeName = this.$store.getBreadcrumbRouteName();
            return routeName && this.$route.name === routeName;
        }
    },

    watch: {
        '$route.name'(name) {
            const breadcrumbRoute = this.$store.getBreadcrumbRouteName();
            if (breadcrumbRoute && name !== breadcrumbRoute) {
                this.$store.setBreadcrumbTitle('');
            }
        }
    },

    methods: {
        handleBack() {
            const routeName = this.$store.getBreadcrumbRouteName();
            this.$store.setBreadcrumbTitle('');
            if (routeName && this.$route.name !== routeName) {
                this.$router.push({ name: routeName });
            }
        }
    }
};
</script>

<style lang="less" scoped>
.bfe-breadcrumb {
    .breadcrumb-link {
        color: #2d8cf0;
        cursor: pointer;

        &:hover {
            color: #5cadff;
        }
    }
}
</style>
