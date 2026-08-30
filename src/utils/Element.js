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
import Vue from 'vue';
import {
  Icon,
  Pagination,
  Select,
  Option,
  OptionGroup,
  Button,
  InputNumber,
} from 'element-ui';
import VueI18n from 'vue-i18n';
import enLocale from 'element-ui/lib/locale/lang/en';
import zhLocale from 'element-ui/lib/locale/lang/zh-CN';
import ElementLocale from 'element-ui/lib/locale';
import { getLang } from '@/utils/i18n';

Vue.use(VueI18n);
Vue.use(Icon);
Vue.use(Button);
Vue.use(Select);
Vue.use(Option);
Vue.use(OptionGroup);
Vue.use(Pagination);
Vue.use(InputNumber);

const messages = {
  en: {
    ...enLocale,
  },
  zh: {
    ...zhLocale,
  },
};
const i18n = new VueI18n({
  locale: getLang(),
  messages,
});
ElementLocale.i18n((key, value) => i18n.t(key, value));
