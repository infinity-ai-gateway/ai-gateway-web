# 关键业务流程

**运行时执行顺序**：网关先执行模型访问控制检查流程，如果通过，再执行限流检查流程，如果通过，再执行配额扣减流程。

## 1. 创建API-Key的完整流程
```text
1. 调用 POST /api-keys
   └─ 校验quota_plan合法性（若传入）
   └─ 校验rate_limit_policy合法性（若传入且enabled=true，rules至少配置一项）
   └─ 校验entity_id合法性（若不为空，entity存在）
   └─ 校验models/subnet格式
   └─ 校验key全局唯一性（若传入）
2. 若未传入quota_plan，使用默认值（unlimited=true, pass_when_no_enough_quota=false, quota=0, unit=total_token, reset_period=never）
3. 若未传入rate_limit_policy，使用默认值（enabled=false, rules为空）
4. 若传入quota_plan且unlimited=false：
   └─ 创建QuotaBalance（remaining = quota，used = 0）
5. 若传入rate_limit_policy：
   └─ 创建RateLimitPolicy
6. 若未传入key则后台生成，否则使用传入的key，写入持久化存储，绑定上述资源
7. 返回结果，含完整的嵌套结构（不含balance）
```

## 2. 创建Entity的完整流程
```text
1. 调用 POST /entities
   └─ 校验type合法性（必须已定义）
   └─ 校验parent_id合法性（若不为空，父Entity的Entity-Type的level必须小于本Entity的Entity-Type的level）
   └─ 校验name全局唯一性
   └─ 校验quota_plan合法性（若传入）
   └─ 校验rate_limit_policy合法性（若传入且enabled=true，rules至少配置一项）
2. 若未传入quota_plan，使用默认值
3. 若未传入rate_limit_policy，使用默认值（enabled=false）
4. 若传入quota_plan且unlimited=false：
   └─ 创建QuotaPackage及对应QuotaBalance
5. 若传入rate_limit_policy：
   └─ 创建RateLimitPolicy
6. 写入entity
7. 返回结果，含完整的嵌套结构（不含balance）
```

## 3. 运行时网关模型访问控制检查流程（数据面）
```text
1. 网关收到请求，解析API-Key和请求模型（如gpt-4）
2. 查询API-Key元数据（缓存），获取models字段
3. 检查API-Key的models字段：
   a. 若models包含"*"，通过API-Key自身检查
   b. 若models不包含"*"，检查请求模型是否在models列表中：
      - 若不在列表中，拒绝请求（403）
      - 若在列表中，通过
4. 若API-Key的entity_id不为空，检查Entity层级模型访问控制：
   a. 从该Entity开始，向上递归遍历所有祖先Entity（包含自身），构建检查链
   b. 对每个Entity依次检查：
      - block_models检查（黑名单优先）：
        - 若block_models包含"*"，拒绝请求（403）
        - 若请求模型在block_models中，拒绝请求（403）
      - allow_models检查（白名单）：
        - 若allow_models包含"*"，通过该Entity检查
        - 若请求模型不在allow_models中，拒绝请求（403）
        - 若请求模型在allow_models中，通过该Entity检查
   c. 检查链中任一Entity触发拒绝，请求立即拒绝（403）
5. 模型访问控制检查通过后，进入限流检查流程（14.4）
```

**说明**：
- API-Key的`models`为白名单机制，仅控制该API-Key自身可访问的模型范围
- Entity的`block_models`为黑名单机制，优先级高于`allow_models`；任一Entity层级（含祖先）的`block_models`命中，即拒绝请求
- Entity的`allow_models`为白名单机制，检查链中所有Entity的`allow_models`都必须包含请求模型（取交集逻辑）
- 若API-Key未挂载到任何Entity（entity_id为空），仅执行API-Key自身的models检查

---

## 4. 运行时网关限流检查流程（数据面）
```text
1. 网关收到请求，解析API-Key和请求模型（如gpt-4）
2. 查询API-Key元数据（缓存），获取rate_limit_policy和entity_id
3. 构建Rate-Limit Policy检查列表（使用Set去重，相同policy_id只检查一次）：
   a. 若API-Key的rate_limit_policy.enabled=true，加入列表
   b. 若API-Key的entity_id不为空：
      - 查询该entity的rate_limit_policy，若enabled=true则加入
      - 递归查询该entity的所有祖先entity，将每个祖先的rate_limit_policy（若enabled=true）加入
4. 若检查列表为空，直接放行（不限流）
5. 按列表遍历每个policy：
   a. 获取Policy的rules，依次检查（仅检查与本次请求模型匹配的规则，model="*"或model等于请求模型时视为匹配）：
      - tpm: 采用滑动窗口机制，步长step_minutes，统计当前窗口内已用token数
        - 若已用token + 本次请求token > max_tokens，限流失败（429）
      - rpm: 采用固定窗口（计数器）机制，以window_minutes为固定周期
        - 检查当前窗口内已用请求数：
          - 若已用请求 + 1 > max_requests，限流失败（429）
          - 若已用请求 + 1 <= max_requests，计数器+1，限流通过
      - max_concurrency: 检查当前并发请求数
        - 若max_concurrency=-1，跳过并发检查
        - 若当前并发 >= max_concurrency，限流失败（429）
   b. 若当前Policy任一规则触发限流，标记失败，立即拒绝请求
6. 所有适用的Rate-Limit Policy必须全部通过，请求才进入配额扣减阶段（14.5）
   └─ 任一Policy触发限流，请求拒绝（429），不再执行配额扣减
```

## 5. 运行时网关配额扣减流程（数据面）
```text
1. 限流检查（14.4）通过后，进入配额扣减阶段
2. 查询API-Key元数据（缓存），获取quota_plan、entity_id、unlimited_quota
3. 若unlimited_quota=true，直接放行
4. 构建Quota Plan扣减列表（使用Set去重，相同plan_id只扣减一次）：
   a. 若API-Key的quota_plan.unlimited=false，加入列表
   b. 若API-Key的entity_id不为空：
      - 查询该entity的quota_plan，若unlimited=false则加入
      - 递归查询该entity的所有祖先entity，将每个祖先的quota_plan（若unlimited=false）加入
5. 若扣减列表为空，扣减失败，请求拒绝（429002）
6. 按扣减列表遍历每个quota_plan：
   a. 对quota执行扣减：
      - 查询该quota对应的quota-balance
      - 检查quota-balance的remaining：
        - 若remaining == 0：扣减失败（无可用余额）
        - 若remaining >= needed：
          - 执行DECRBY balance.remaining by needed
          - 扣减成功
        - 若remaining < needed：
          - 若pass_when_no_enough_quota为true：
            - 执行DECRBY balance.remaining by remaining（扣减至0）
            - 扣减成功（已扣减部分保留）
          - 若pass_when_no_enough_quota为false：扣减失败（余额不足）
   b. 若当前Plan扣减失败，标记失败
7. 遍历完成后，若所有quota_plan的unlimited均为true（没有任何Plan被实际执行扣减），则扣减失败，请求拒绝（429002）
8. 所有实际执行扣减的Plan必须全部扣减成功，请求才通过
   └─ 任一实际执行扣减的Plan失败，触发所有已扣减balance的原子回滚（包含其他成功Plan的扣减），请求拒绝（429002）
```

## 6. 配置变更的级联与隔离
| 变更操作 | 级联影响 | 隔离机制 |
|----------|----------|----------|
| 修改API-Key的quota_plan | 实时生效，影响后续请求；更新底层资源 | 旧资源若不被其他API-Key/Entity引用则级联删除 |
| 修改API-Key的rate_limit_policy | 实时生效，影响后续请求 | 旧资源若不被引用则级联删除 |
| 修改API-Key的route_rules | 实时生效，影响后续请求的路由选择 | 更新底层资源，旧资源若不被引用则级联删除 |
| 修改API-Key的models | 实时生效，影响后续请求的模型访问控制 | 更新API-Key元数据 |
| 修改API-Key的entity_id（挂载/解绑） | 实时生效，影响后续请求的层级限流、配额扣减、模型访问控制和路由选择 | 旧挂载关系立即解除，无残留 |
| 修改Entity的allow_models | 实时生效，影响所有挂载到该Entity及其后代的API-Key | 更新Entity元数据 |
| 修改Entity的block_models | 实时生效，影响所有挂载到该Entity及其后代的API-Key | 更新Entity元数据 |
| 修改Entity的parent_id | 实时生效，影响该Entity及其所有后代Entity挂载的API-Key | 禁止level违反层级关系的修改 |
| 修改Entity的quota_plan | 实时生效，影响所有挂载到该Entity及其后代的API-Key | 更新底层资源，旧资源若不被引用则级联删除 |
| 修改Entity的rate_limit_policy | 实时生效，影响所有挂载到该Entity及其后代的API-Key | 更新底层资源，旧资源若不被引用则级联删除 |
| 修改Entity的route_rules | 实时生效，影响所有挂载到该Entity及其后代的API-Key | 更新底层资源，旧资源若不被引用则级联删除 |
| 删除Entity | 必须先解绑所有API-Key且无子Entity | 有子Entity或挂载API-Key时禁止删除；级联删除其专属资源 |
| 删除API-Key | 级联删除其quota_plan、rate_limit_policy及底层资源（若不被其他引用） | 引用计数管理 |
| 修改quota_plan.quota | 同步更新balance.remaining和used | 视为重置配额 |

---
