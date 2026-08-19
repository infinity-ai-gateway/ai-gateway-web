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
import store from './store';

export function urlFormat(url, data) {
    if (!data) {
        data = {};
    }
    if (!data.product_name) {
        data.product_name = 'AI_product';
    }
    return url.replaceAll(/{\w+}/g, key => {
        return data[key.substr(1, key.length - 2)];
    });
}

export function getPrefixedNameSuffix(fullName, prefix = 'AI_product') {
    const prefixWithDot = `${prefix}.`;
    if (fullName.startsWith(prefixWithDot)) {
        return fullName.slice(prefixWithDot.length);
    }
    const dotIndex = fullName.indexOf('.');
    return dotIndex >= 0 ? fullName.slice(dotIndex + 1) : fullName;
}

export function timeFormatFunc(s) {
    if (s < 0) {
        return '';
    }
    let hour = Math.floor(s / 3600);
    let min = Math.floor(s / 60) % 60;
    let sec = s % 60;
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (min < 10) {
        min = '0' + min;
    }
    if (sec < 10) {
        sec = '0' + sec;
    }
    return hour + ':' + min + ':' + sec;
}

export function fields(obj, keys) {
    for (let i = 0; i < keys.length; i++) {
        if (!obj) {
            return undefined;
        }
        obj = obj[keys[i]];
    }
    return obj;
}
