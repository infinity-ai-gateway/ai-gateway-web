window.MockData = {
  user: { name: 'admin' },
  entities: [
    {
      id: 1,
      name: '研发部',
      type: 'dep',
      parent_id: '',
      allow_models: ['*'],
      block_models: [],
      create_time: 1704844800,
      update_time: 1735689600,
      quota_plan: {
        unlimited: false,
        quota: 10000000,
        balance: { used: 1200 },
        unit: 'total_token',
        reset_period: 'monthly',
        pass_when_no_enough_quota: false
      },
      rate_limit_policy: {
        enabled: true,
        rules: {
          max_concurrency: 50,
          tpm: [{ name: 'tpm-default', model: '*', window_minutes: 1, max_tokens: 100000, step_minutes: 1 }],
          rpm: [{ name: 'rpm-default', model: '*', window_minutes: 1, max_requests: 1000 }]
        }
      }
    },
    {
      id: 2,
      name: '算法组',
      type: 'team',
      parent_id: 1,
      allow_models: ['gpt-4o'],
      block_models: [],
      create_time: 1704844800,
      update_time: 1735689600,
      quota_plan: { unlimited: true, quota: 0, balance: { used: 0 }, unit: 'total_token', reset_period: 'never', pass_when_no_enough_quota: false },
      rate_limit_policy: { enabled: false, rules: { max_concurrency: -1, tpm: [], rpm: [] } }
    },
    {
      id: 3,
      name: '测试组',
      type: 'team',
      parent_id: 1,
      allow_models: ['*'],
      block_models: ['claude-3-5-sonnet'],
      create_time: 1704844800,
      update_time: 1735689600,
      quota_plan: {
        unlimited: false,
        quota: 5000000,
        balance: { used: 500 },
        unit: 'total_token',
        reset_period: 'monthly',
        pass_when_no_enough_quota: false
      },
      rate_limit_policy: {
        enabled: true,
        rules: { max_concurrency: 100, tpm: [], rpm: [] }
      }
    }
  ],
  entityTypes: [
    { type_name: 'dep', level: 1, description: '一级部门', create_time: 1704844800 },
    { type_name: 'team', level: 2, description: '二级团队', create_time: 1704844800 }
  ],
  modelGroups: [
    { label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
    { label: 'Anthropic', models: ['claude-3-5-sonnet'] }
  ],
  apiKeys: [
    {
      id: 'ak-001',
      key: 'gw-a1b2c3d4e5f6g7h8',
      description: '研发部主 Key',
      enabled: true,
      unlimited_quota: false,
      subnet: '*',
      models: ['*'],
      entity: { id: 'e1', name: '研发部', type: 'dep' },
      quota_plan: {
        unlimited: false,
        quota: 1000000,
        balance: { used: 120000 },
        unit: 'total_token',
        reset_period: 'monthly',
        pass_when_no_enough_quota: false
      },
      rate_limit_policy: {
        enabled: true,
        rules: {
          max_concurrency: 100,
          tpm: [{ name: 'tpm-gpt4', model: 'gpt-4o', window_minutes: 1, max_tokens: 100000, step_minutes: 1 }],
          rpm: [{ name: 'rpm-default', model: '*', window_minutes: 1, max_requests: 1000 }]
        }
      }
    },
    {
      id: 'ak-002',
      key: 'gw-e5f6g7h8i9j0k1l2',
      description: '测试环境 Key',
      enabled: false,
      unlimited_quota: true,
      subnet: '10.0.0.0/24',
      models: ['gpt-4o'],
      entity: { id: 'e3', name: '测试组', type: 'team' },
      quota_plan: { unlimited: true, quota: 0, balance: { used: 0 }, unit: 'total_token', reset_period: 'never' },
      rate_limit_policy: { enabled: false, rules: { max_concurrency: -1, tpm: [], rpm: [] } }
    }
  ],
  clusters: [
    { name: 'test', description: '' },
    { name: 'cluster-test1', description: '测试更新' }
  ],
  forwardRules: [
    {
      name: 'vip-user-route',
      expression: 'req_header_value_in("user", "vip", false)',
      cluster_name: 'cluster-test1',
      description: 'VIP 用户路由'
    },
    {
      name: 'beta-path-route',
      expression: 'req_path_prefix_in("/beta", false)',
      cluster_name: 'test',
      description: 'Beta 流量'
    }
  ],
  aiRules: [
    { name: 'model-route-1', priority: 1, enabled: true, description: 'GPT 模型路由' },
    { name: 'model-route-2', priority: 2, enabled: false, description: 'Claude 模型路由' }
  ],
  gatewayInstances: [
    { hostname: 'gateway-01', ip: '10.0.1.10', port: 8080 },
    { hostname: 'gateway-02', ip: '10.0.1.11', port: 8080 }
  ],
  users: [
    { user_name: 'admin', is_admin: true },
    { user_name: 'operator', is_admin: true },
    { user_name: 'viewer', is_admin: false }
  ],
  tokens: [
    { name: 'gateway-internal', scope: 'System', token: 'sys-token-a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    { name: 'support-bot', scope: 'Support', token: 'sup-token-9876fedc-ba09-8765-4321-10abcdef9876' }
  ],
  clusterInstances: [
    { ip: '172.18.1.140', port: 16516 },
    { ip: '172.18.1.140', port: 16517 },
    { ip: '172.18.1.140', port: 16518 },
    { ip: '', port: 80, error: true }
  ]
};
