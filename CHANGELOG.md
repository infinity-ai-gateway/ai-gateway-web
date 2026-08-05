<!--
 Copyright(c) 2026 Beijing Yingfei Networks Technology Co.Ltd. 

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http: //www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 Copyright (c) 2021 The BFE Authors.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
-->
<!--
This changelog should always be read on `master` branch. Its contents on other branches
does not necessarily reflect the changes.
-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v0.0.5] - 2026-07-24

### Added

- Reduced module scope: removed legacy modules including GSLB, Domains, SubClusters, AIClusters, and the old Instance Pool to streamline the product around AI gateway core workflows
- List filtering: added filtering capabilities to key list views for easier data discovery
- IPv6 CIDR support: enhanced utility functions to support IPv6 CIDR parsing, expansion, and comparison
- Consumer management enhancements: improved Entity create/edit/view flows and hierarchical organization support
- API Key enhancements: refined API Key list, detail, and upsert components with better quota and rate-limit handling
- Expanded i18n coverage: updated English and Chinese translations for consumer, cluster, and route management

### Changed

- Navigation/sidebar reorganization: simplified sidebar navigation to focus on Resource, Route, Consumer, User, and AI Gateway Instance Pool
- Router path updates: updated router paths; removed deprecated routes and set the default landing page to product.home
- Component consolidation: merged and simplified cluster-related components (GatewayConfig, InstancePool, Review, Scheduler, etc.)
- UI refresh: updated theme styles and sidebar layout
- Code cleanup: removed deprecated modules and related assets

### Fixed

- Fixed multiple interaction issues in gateway configuration and route rule forms
- Fixed request-layer error handling and response processing
- Addressed UI rendering issues in pageTable and sidebar navigation
- Fixed login and authorization edge cases

## [v0.0.4] - 2026-07-15

### Added

- **Certificate management** module
- Grouped model selector (Entity & API Key)
- LLM models display in cluster review
- Instance pool and domain validation
- Certificate user guide and expanded i18n (en/zh)

### Fixed

- Route rules empty filter submission
- `pageTable` search compatibility
- Gateway config model list when editing
- Certificate sidebar nav icon
- Entity parent selector clear behavior

### Changed

- Entity & API Key: grouped model selectors, description limit 1024
- Entity type list column and validation tweaks
- Quota and rate limit validation (INT64 bounds, field-level checks)
- AI business cluster list action button order
- Minor UI and docs updates

## [v0.0.3] - 2026-07-08

### Added

- Consumer management: **Entity** module with Entity type management and Entity organization management (hierarchical parent/child, model allow/block lists, quota plan, rate limit policy)
- API Key management enhancements: detail view, quota plan configuration, rate limit policy (TPM/RPM/max concurrency), Entity mounting, and manual quota reset
- Expanded i18n coverage for consumer management, navigation labels, and form validation messages (en/zh)
- User guide restructure: consumer management, resource management, route management, and user management docs with updated screenshots

### Fixed

- Request layer error handling and response parsing improvements
- Gateway config and route rules interaction issues

### Changed

- Navigation/sidebar reorganized around resource, route, consumer, and user management
- Router paths updated for AI gateway instance pool (`instance-pool-ai`) and AI gateway cluster (`ai-clusters`)
- `pageTable` component enhanced (search, sort, rendering)
- Theme styles (`public.less`) and login page UI refreshed
- README and development docs updated to reflect current module layout

### Dependencies

- Updated `package-lock.json` with toolchain and transitive dependency bumps

## [v0.0.2] - 2026-05-08

AI Gateway Web v0.0.2 — Instance pool & build refresh. Focuses on EPP instance pool details, clearer error handling, a Webpack/Babel toolchain upgrade (NoahV removed), and dependency/security updates, plus UI/i18n tweaks.

### Added

- Instance pool detail view with EPP domain and endpoint (IP) lists
- Related routing updates

### Fixed

- Error / response handling in AI route rules and gateway config
- Code scanning issue (inefficient regex)

### Changed

- Build: NoahV removed; Webpack & Babel config modernized; docs/scripts updated
- Request layer, theme (Less), i18n (en/zh), and copyright header order adjusted

### Dependencies

- Bumped toolchain and transitive deps (e.g. webpack-related packages, url-parse, qs, express, less, and others)

## [v0.0.1] - 2026-02-10

### Added

- Initial released version
- Resource management: gateway domains, instance pools, clusters; LLM resources (instance pool/sub-cluster/cluster)
- Routing management: URL/Path/Header match, model name based routing, default rule
- Consumer management: API Key lifecycle with model allowlist, token quota, expiry, IP whitelist
- User & access: system/tenant views, user management, token management

[v0.0.5]: https://github.com/yf-networks/ai-gateway-web/releases/tag/v0.0.5
[v0.0.4]: https://github.com/yf-networks/ai-gateway-web/releases/tag/v0.0.4
[v0.0.3]: https://github.com/yf-networks/ai-gateway-web/releases/tag/v0.0.3
[v0.0.2]: https://github.com/yf-networks/ai-gateway-web/releases/tag/v0.0.2
[v0.0.1]: https://github.com/yf-networks/ai-gateway-web/releases/tag/v0.0.1
