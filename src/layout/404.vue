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
    <div class="common-404">
        <div class="error-page">
            <h1 class="error-code">404</h1>
            <p class="error-desc">{{ $t('login.tip404') || 'Page not found' }}</p>
            <Button type="primary" @click="goHome">{{ $t('com.backToHome') || 'Back to Home' }}</Button>
        </div>
    </div>
</template>
<script>
export default {
    name: 'common-404',
    methods: {
        goHome() {
            this.$router.push('/');
        }
    }
};
</script>
<style lang="less" scoped>
.common-404 {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f8f9fa;
}
.error-page {
    text-align: center;
}
.error-code {
    font-size: 120px;
    font-weight: bold;
    color: #409eff;
    margin: 0;
}
.error-desc {
    font-size: 18px;
    color: #666;
    margin: 20px 0;
}
</style>
