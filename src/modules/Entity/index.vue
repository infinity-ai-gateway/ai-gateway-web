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
<template>
    <div>
        <Tabs v-model="val" :animated="false">
            <TabPane :label="$t('entity.orgManagement')" name="entity">
                <EntityList v-if="val === 'entity'" />
            </TabPane>
            <TabPane :label="$t('entity.typeManagement')" name="entityType">
                <EntityTypeList v-if="val === 'entityType'" />
            </TabPane>
        </Tabs>
    </div>
</template>

<script>
import EntityTypeList from './components/EntityTypeList.vue';
import EntityList from './components/EntityList.vue';
export default {
    components: {
        EntityTypeList,
        EntityList
    },
    data() {
        return {
            val: 'entity'
        };
    }
};
</script>

<style lang="less" scoped></style>
