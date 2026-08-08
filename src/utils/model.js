/**
 * Copyright(c) 2026 The Infinity AI Gateway Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function getServiceGroupLabel(service) {
    if (!service) {
        return '';
    }
    return service.cluster_name || service.display_name || service.name || '';
}

export function getModelGroupsFromServices(modelServices) {
    const groupMap = new Map();

    for (const service of modelServices || []) {
        if (!service.models || service.models.length === 0) {
            continue;
        }
        const label = getServiceGroupLabel(service);
        if (!groupMap.has(label)) {
            groupMap.set(label, []);
        }
        const models = groupMap.get(label);
        service.models.forEach(model => {
            if (!models.includes(model)) {
                models.push(model);
            }
        });
    }

    return Array.from(groupMap.entries()).map(([label, models]) => ({
        label,
        models
    }));
}
