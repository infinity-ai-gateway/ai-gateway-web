window.ClusterUpsert = (function () {
  var STEP_DEFS = [
    { content: '基本配置' },
    { content: '超时和重传' },
    { content: '被动健康检查' },
    { content: '实例配置' },
    { content: '大模型配置' },
    { content: '复查&检查' },
  ];

  var HASH_STRATEGY_OPTIONS = [
    'CLIENT_ID_ONLY',
    'CLIENT_IP_ONLY',
    'CLIENT_ID_PREFERED',
  ];

  var ALL_MODELS = [
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-5-sonnet',
    'deepseek-chat',
  ];

  // 名称格式校验：字母/数字/连字符/下划线/点，以字母或数字开头，长度 1-64
  function validateClusterNameFormat(name) {
    if (!name) return false;
    if (name.length > 64) return false;
    return /^[a-zA-Z0-9][a-zA-Z0-9_\-.]*$/.test(name);
  }

  // 描述长度校验
  function validateDescription(desc) {
    if (!desc) return true;
    if (desc.length > 256) return false;
    // 不能包含控制字符
    if (/[\x00-\x1F\x7F]/.test(desc)) return false;
    return true;
  }

  function maskSecretKey(key) {
    if (!key) return '';
    var s = String(key);
    if (s.length <= 8) return '****';
    return s.slice(0, 4) + '****' + s.slice(-4);
  }

  function cloneInstance(item) {
    return {
      ip: item.ip || '',
      ports: {
        Default:
          item.port != null
            ? item.port
            : item.ports && item.ports.Default != null
            ? item.ports.Default
            : 80,
      },
      hostname: item.hostname || '',
      weight: item.weight != null ? item.weight : 100,
      tags: item.tags || { key: 'value' },
    };
  }

  function getDefaultInstances() {
    var list = (window.MockData && MockData.clusterInstances) || [];
    var instances = list
      .filter(function (item) {
        return item.ip;
      })
      .map(cloneInstance);
    if (instances.length) return instances;
    return [
      {
        ip: '172.18.1.140',
        ports: { Default: 16516 },
        hostname: '',
        weight: 50,
        tags: { key: 'value' },
      },
      {
        ip: '172.18.1.140',
        ports: { Default: 16517 },
        hostname: '',
        weight: 30,
        tags: { key: 'value' },
      },
      {
        ip: '172.18.1.140',
        ports: { Default: 16518 },
        hostname: '',
        weight: 20,
        tags: { key: 'value' },
      },
    ];
  }

  function ensurePrefilledData(data) {
    if (!data.instancePoolData || !data.instancePoolData.length) {
      data.instancePoolData = getDefaultInstances();
    }
    if (!data.headerList || !data.headerList.length) {
      data.headerList = [
        {
          key: 'Authorization',
          value: 'Bearer sk-****',
          originalValue: '',
          valueModified: false,
        },
      ];
    }
    if (
      !data.llmConfigData.model_mappings ||
      !data.llmConfigData.model_mappings.length
    ) {
      data.llmConfigData.model_mappings = [
        { source_model: 'gpt-4-turbo', target_model: 'gpt-4o' },
      ];
    }
    if (!data.llmConfigData.models || !data.llmConfigData.models.length) {
      data.llmConfigData.models = ['gpt-4o'];
    }
    if (
      !Array.isArray(data.llmConfigData.keys) ||
      !data.llmConfigData.keys.length
    ) {
      data.llmConfigData.keys = [{ name: '', key: '', weight: 100 }];
    }
    if (!data.llmConfigData.key_policy) {
      data.llmConfigData.key_policy = {
        strategy: 'weighted_random',
        max_retries: 0,
        retry_backoff_initial: 500,
        retry_backoff_max: 5000,
      };
    }
  }

  function getInstanceIpStr(data) {
    ensurePrefilledData(data);
    return data.instancePoolData
      .map(function (item) {
        var port =
          item.ports && item.ports.Default != null ? item.ports.Default : 80;
        return (item.ip || '') + ':' + port;
      })
      .filter(function (line) {
        return line !== ':';
      })
      .join(',');
  }

  // 编辑页使用：只返回第一个实例的 ip:port
  function getInstanceIpFirstStr(data) {
    ensurePrefilledData(data);
    var instances = data.instancePoolData
      .map(function (item) {
        var port =
          item.ports && item.ports.Default != null ? item.ports.Default : 80;
        return (item.ip || '') + ':' + port;
      })
      .filter(function (line) {
        return line !== ':';
      });
    return instances.length ? instances[0] : '';
  }

  function getProviderTypes() {
    return (
      (window.MockData && MockData.modelProviderTypes) || [
        { type: 'openai_compatible', label: 'OpenAI 兼容' },
        { type: 'anthropic', label: 'Anthropic' },
        { type: 'azure_openai', label: 'Azure OpenAI' },
      ]
    );
  }

  function createDefaultData(row) {
    row = row || {};
    return {
      baseConfigData: {
        name: row.name || '',
        description: row.description || '',
        protocol: 'https',
        connection: {
          max_idle_conn_per_rs: 0,
          cancel_on_client_close: 'false',
        },
        buffers: { req_write_buffer_size: 512 },
        sticky_sessions: {
          enabled: 'false',
          hash_strategy: 'CLIENT_ID_ONLY',
          hash_header: '',
        },
        timeouts: {
          timeout_conn_serv: 2000,
          timeout_response_header: 60000,
          timeout_readbody_client: 30000,
          timeout_read_client_again: 60000,
          timeout_write_client: 60000,
        },
        retries: {
          max_retry_in_cluster: 2,
        },
      },
      passiveHealthData: {
        interval: 1000,
        failnum: 10,
        host: 'example.com',
        uri: '/health',
        statuscode: 200,
      },
      instanceMode: 'ip',
      domainName: '',
      instancePoolData: getDefaultInstances(),
      llmConfigData: {
        provider_type: '',
        provider: '',
        strip_prefix: false,
        match_prefix: '',
        model_endpoint: {
          schema: 'https',
          uri: '/v1/models',
          headers: {},
        },
        models: ['gpt-4o'],
        model_mappings: [
          { source_model: 'gpt-4-turbo', target_model: 'gpt-4o' },
        ],
        keys: [{ name: '', key: '', weight: 100 }],
        key_policy: {
          strategy: 'weighted_random',
          max_retries: 0,
          retry_backoff_initial: 500,
          retry_backoff_max: 5000,
        },
      },
      headerList: [
        {
          key: 'Authorization',
          value: 'Bearer sk-****',
          originalValue: '',
          valueModified: false,
        },
      ],
    };
  }

  // ============ 基本配置 ============
  function renderBaseConfig(data, isAdd, clusterNames) {
    var b = data.baseConfigData;
    var stickyEnabled = b.sticky_sessions.enabled === 'true';

    var hashStrategyBlock = stickyEnabled
      ? IvuUI.formTopItem(
          '哈希策略',
          '<select class="proto-field from-item-inp" data-field="base.sticky_sessions.hash_strategy" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
            HASH_STRATEGY_OPTIONS.map(function (item) {
              return (
                '<option value="' +
                item +
                '"' +
                (b.sticky_sessions.hash_strategy === item ? ' selected' : '') +
                '>' +
                item +
                '</option>'
              );
            }).join('') +
            '</select>',
          true,
        )
      : '';

    var hashHeaderBlock =
      stickyEnabled && b.sticky_sessions.hash_strategy !== 'CLIENT_IP_ONLY'
        ? IvuUI.formTopItem(
            '哈希头部',
            '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.sticky_sessions.hash_header" value="' +
              IvuUI.escapeHtml(b.sticky_sessions.hash_header) +
              '" /></div>',
            true,
          )
        : '';

    return IvuUI.formTop(
      IvuUI.formTopItem(
        '集群名称',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.name" value="' +
          IvuUI.escapeHtml(b.name) +
          '" ' +
          (isAdd ? '' : 'disabled="disabled" ') +
          'placeholder="1-64个字符，以字母或数字开头，支持字母、数字、下划线、连字符、点"/></div>',
        true,
      ) +
        IvuUI.formTopItem(
          '集群说明',
          '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.description" value="' +
            IvuUI.escapeHtml(b.description) +
            '" placeholder="最多256个字符，不能包含控制字符"/></div>',
        ) +
        IvuUI.formTopItem(
          '协议',
          '<select class="proto-field from-item-inp" data-field="base.protocol" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
            '<option value="http"' +
            (b.protocol === 'http' ? ' selected' : '') +
            '>http</option>' +
            '<option value="https"' +
            (b.protocol === 'https' ? ' selected' : '') +
            '>https</option>' +
            '</select>',
          true,
        ) +
        IvuUI.formTopItem(
          '单个后端最大空闲连接数',
          IvuUI.inputNumber(
            b.connection.max_idle_conn_per_rs,
            'class="proto-field" data-field="base.connection.max_idle_conn_per_rs" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '会话保持启用',
          '<select class="proto-field from-item-inp" data-field="base.sticky_sessions.enabled" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
            '<option value="true"' +
            (b.sticky_sessions.enabled === 'true' ? ' selected' : '') +
            '>启用</option>' +
            '<option value="false"' +
            (b.sticky_sessions.enabled === 'false' ? ' selected' : '') +
            '>停用</option>' +
            '</select>',
          true,
        ) +
        hashStrategyBlock +
        hashHeaderBlock +
        IvuUI.formTopItem(
          '请求写缓存大小（Byte）',
          IvuUI.inputNumber(
            b.buffers.req_write_buffer_size,
            'class="proto-field" data-field="base.buffers.req_write_buffer_size" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '后端连接随客户端连接关闭 ',
          '<select class="proto-field from-item-inp" data-field="base.connection.cancel_on_client_close" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
            '<option value="true"' +
            (b.connection.cancel_on_client_close === 'true'
              ? ' selected'
              : '') +
            '>启用</option>' +
            '<option value="false"' +
            (b.connection.cancel_on_client_close === 'false'
              ? ' selected'
              : '') +
            '>停用</option>' +
            '</select>',
          true,
        ),
    );
  }

  // ============ 超时和重传 ============
  function renderTimeout(data) {
    var t = data.baseConfigData.timeouts;
    var r = data.baseConfigData.retries;
    return IvuUI.formTop(
      IvuUI.formTopItem(
        '客户端连接空闲超时(ms) ',
        IvuUI.inputNumber(
          t.timeout_read_client_again,
          'class="proto-field" data-field="base.timeouts.timeout_read_client_again" min="0"',
        ),
        true,
      ) +
        IvuUI.formTopItem(
          '读客户端请求Body超时(ms)',
          IvuUI.inputNumber(
            t.timeout_readbody_client,
            'class="proto-field" data-field="base.timeouts.timeout_readbody_client" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '连接后端超时(ms) ',
          IvuUI.inputNumber(
            t.timeout_conn_serv,
            'class="proto-field" data-field="base.timeouts.timeout_conn_serv" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '读后端响应头部超时(ms) ',
          IvuUI.inputNumber(
            t.timeout_response_header,
            'class="proto-field" data-field="base.timeouts.timeout_response_header" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '写客户端响应Body超时(ms)',
          IvuUI.inputNumber(
            t.timeout_write_client,
            'class="proto-field" data-field="base.timeouts.timeout_write_client" min="0"',
          ),
          true,
        ) +
        IvuUI.formTopItem(
          '同集群重试次数',
          IvuUI.inputNumber(
            r.max_retry_in_cluster,
            'class="proto-field" data-field="base.retries.max_retry_in_cluster" min="0"',
          ),
          true,
        ),
    );
  }

  // ============ 被动健康检查 ============
  function renderPassiveHealth(data) {
    var h = data.passiveHealthData;
    return (
      '<div class="health-check">' +
      IvuUI.formTop(
        IvuUI.formTopItem(
          '故障阈值（触发设置实例为不可用，启动被动健康检查）',
          IvuUI.inputNumber(
            h.failnum,
            'class="proto-field from-item-inp" data-field="health.failnum" min="0"',
          ),
          true,
        ) +
          IvuUI.formTopItem(
            '健康检查间隔(ms)',
            IvuUI.inputNumber(
              h.interval,
              'class="proto-field from-item-inp" data-field="health.interval" min="0"',
            ),
            true,
          ) +
          IvuUI.formTopItem(
            '健康检查Host',
            '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="health.host" value="' +
              IvuUI.escapeHtml(h.host) +
              '" placeholder="example.com" /></div>',
            true,
          ) +
          IvuUI.formTopItem(
            '健康检查Uri',
            '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="health.uri" value="' +
              IvuUI.escapeHtml(h.uri) +
              '" placeholder="/example" /></div>',
            true,
          ) +
          IvuUI.formTopItem(
            '健康检查期望的状态码',
            IvuUI.inputNumber(
              h.statuscode,
              'class="proto-field from-item-inp" data-field="health.statuscode" min="0"',
            ),
            true,
          ),
      ) +
      '</div>'
    );
  }

  // ============ 实例配置 ============
  function renderInstancePool(data) {
    ensurePrefilledData(data);
    var rows = data.instancePoolData
      .map(function (item, index) {
        return (
          '<tr data-instance-index="' +
          index +
          '">' +
          '<td><div class="ivu-input-wrapper ivu-input-type-text">' +
          '<input type="text" class="ivu-input proto-instance-ip" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(item.ip) +
          '" placeholder="请输入IP地址" />' +
          '</div></td>' +
          '<td>' +
          '<div class="ivu-input-number poolInput" style="width:80px;display:inline-block;vertical-align:middle;">' +
          '<input type="number" class="ivu-input-number-input proto-instance-port" data-index="' +
          index +
          '" min="1" max="65535" value="' +
          (item.ports.Default != null ? item.ports.Default : 80) +
          '" placeholder="端口值" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;" />' +
          '</div>' +
          '</td>' +
          '<td>' +
          '<div class="ivu-input-number poolInput" style="width:80px;display:inline-block;vertical-align:middle;">' +
          '<input type="number" class="ivu-input-number-input proto-instance-weight" data-index="' +
          index +
          '" min="0" max="100" value="' +
          (item.weight != null ? item.weight : 100) +
          '" placeholder="权重" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;" />' +
          '</div>' +
          '</td>' +
          '<td>' +
          IvuUI.btn(
            '删除',
            'error',
            'small',
            '',
            'data-action="remove-instance" data-index="' +
              index +
              '" ' +
              (data.instancePoolData.length <= 1 ? 'disabled="disabled"' : ''),
          ) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    // 计算权重总和提示
    var weightSum = data.instancePoolData.reduce(function (sum, item) {
      return sum + (Number(item.weight) || 0);
    }, 0);
    var weightTip =
      weightSum === 100
        ? '<div style="color:#19be6b;font-size:12px;margin-top:8px;">权重总和：' +
          weightSum +
          '（符合要求）</div>'
        : '<div style="color:#ed4014;font-size:12px;margin-top:8px;">权重总和：' +
          weightSum +
          '（必须等于 100）</div>';

    return IvuUI.formTop(
      IvuUI.formTopItem(
        '实例形态',
        '<select id="cluster-instance-mode" class="proto-field" data-field="instanceMode" style="width:240px;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
          '<option value="ip"' +
          (data.instanceMode === 'ip' ? ' selected' : '') +
          '>IP</option>' +
          '<option value="domain"' +
          (data.instanceMode === 'domain' ? ' selected' : '') +
          '>服务商域名</option>' +
          '</select>',
      ) +
        (data.instanceMode === 'domain'
          ? IvuUI.formTopItem(
              '服务商域名',
              '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="domainName" id="cluster-domain-name" value="' +
                IvuUI.escapeHtml(data.domainName) +
                '" placeholder="请输入服务商域名，例如 example.com" /></div>',
            )
          : IvuUI.formTopItem(
              '实例IP列表',
              '<div class="formBox"><table border="0" cellspacing="0" cellpadding="0">' +
                '<tr><th>IP地址</th><th>端口</th><th>权重</th><th>操作</th></tr>' +
                rows +
                '</table></div>' +
                IvuUI.btn(
                  '+创建',
                  'primary',
                  'small',
                  '',
                  'id="cluster-add-instance" style="margin-top:8px;"',
                ) +
                weightTip,
            )),
    );
  }

  // ============ 大模型配置 ============
  function renderGatewayConfig(data) {
    ensurePrefilledData(data);
    var llm = data.llmConfigData;
    var ipStr = getInstanceIpFirstStr(data);
    var providerTypes = getProviderTypes();

    // 帮助图标
    function helpIcon(tip) {
      return (
        '<span class="form-help-icon" title="' +
        IvuUI.escapeHtml(tip || '') +
        '">?</span>'
      );
    }

    // Header 行（支持脱敏编辑）
    var headerRows = (data.headerList || [])
      .map(function (header, index) {
        return (
          '<div class="header-pair" data-header-index="' +
          index +
          '">' +
          '<div class="ivu-input-wrapper ivu-input-type-text header-input">' +
          '<input type="text" class="ivu-input proto-header-key" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(header.key) +
          '" placeholder="Header Key" />' +
          '</div>' +
          '<span class="header-separator">:</span>' +
          '<div class="ivu-input-wrapper ivu-input-type-text header-input">' +
          '<input type="text" class="ivu-input proto-header-value" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(header.value) +
          '" placeholder="Header Value" autocomplete="new-password" />' +
          '</div>' +
          '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small proto-header-del-btn" data-action="remove-header" data-index="' +
          index +
          '">' +
          '<span>删除</span></button>' +
          '</div>'
        );
      })
      .join('');

    // 模型映射行
    var mappingRows = (llm.model_mappings || [])
      .map(function (mapping, index) {
        return (
          '<tr data-mapping-index="' +
          index +
          '">' +
          '<td><div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-mapping-key" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(mapping.source_model || '') +
          '" placeholder="请输入原模型名称" /></div></td>' +
          '<td><div class="ivu-select ivu-select-single" style="width:100%;">' +
          '<div class="ivu-select-selection">' +
          '<select class="proto-mapping-value proto-ivu-select-native" data-index="' +
          index +
          '" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
          '<option value="">请选择目标模型</option>' +
          (llm.models || [])
            .map(function (model) {
              return (
                '<option value="' +
                IvuUI.escapeHtml(model) +
                '"' +
                (mapping.target_model === model ? ' selected' : '') +
                '>' +
                IvuUI.escapeHtml(model) +
                '</option>'
              );
            })
            .join('') +
          '</select>' +
          '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
          '</div></div></td>' +
          '<td style="width:80px;">' +
          '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small" data-action="remove-mapping" data-index="' +
          index +
          '">' +
          '<span>删除</span></button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    // 模型多选（模拟 el-select multiple 标签式多选）
    var selectedModels = llm.models || [];
    var modelTagsHtml = selectedModels.length
      ? selectedModels
          .map(function (m) {
            return (
              '<span class="ivu-tag ivu-tag-primary ivu-tag-checked proto-model-tag">' +
              '<span class="ivu-tag-text">' +
              IvuUI.escapeHtml(m) +
              '</span>' +
              '<i class="ivu-icon ivu-icon-ios-close"></i></span>'
            );
          })
          .join('')
      : '<span class="proto-placeholder">请选择模型</span>';

    var modelSelectHtml =
      '<div class="proto-model-select-wrap" style="display:flex;align-items:center;gap:10px;">' +
      '<div class="proto-model-select" id="proto-model-select" style="flex:1;min-height:32px;">' +
      '<div class="proto-model-select-tags">' +
      modelTagsHtml +
      '</div>' +
      '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
      '</div>' +
      '<button type="button" class="ivu-btn ivu-btn-primary" id="cluster-query-models"><span>获取</span></button>' +
      '</div>';

    // 服务鉴权 Keys 表格
    var keyRows = (llm.keys || [])
      .map(function (keyItem, index) {
        return (
          '<tr data-key-index="' +
          index +
          '">' +
          '<td><div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-key-name" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(keyItem.name || '') +
          '" placeholder="Key 名称" /></div></td>' +
          '<td><div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-key-value" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(keyItem.key || '') +
          '" placeholder="Key 值" autocomplete="new-password" /></div></td>' +
          '<td style="width:120px;">' +
          '<div class="ivu-input-number ivu-input-number-default" style="width:100%;">' +
          '<div class="ivu-input-number-input-wrap">' +
          '<input type="number" class="ivu-input-number-input proto-key-weight" data-index="' +
          index +
          '" min="0" max="100" value="' +
          (keyItem.weight != null ? keyItem.weight : 0) +
          '" />' +
          '</div></div>' +
          '</td>' +
          '<td style="width:80px;">' +
          '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small" data-action="remove-key" data-index="' +
          index +
          '">' +
          '<span>删除</span></button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    // 计算 Key 权重总和
    var validKeys = (llm.keys || []).filter(function (k) {
      return (k.name && k.name.trim()) || (k.key && k.key.trim());
    });
    var keyWeightSum = validKeys.reduce(function (sum, k) {
      return sum + (Number(k.weight) || 0);
    }, 0);
    var keyWeightTip = '';
    if (validKeys.length > 0 && keyWeightSum !== 100) {
      keyWeightTip =
        '<p style="color:#ed4014;font-size:12px;margin:8px 0 0;">Key 权重总和必须等于 100</p>';
    }

    // 裁剪前缀 - Switch 开关
    var stripSwitchHtml =
      '<div class="ivu-switch' +
      (llm.strip_prefix ? ' ivu-switch-checked' : '') +
      '" id="proto-strip-prefix-switch">' +
      '<span class="ivu-switch-inner"></span></div>';

    var stripPrefixHtml =
      IvuUI.formTopItem(
        '裁剪前缀' + helpIcon('裁剪前缀配置'),
        stripSwitchHtml,
      ) +
      (llm.strip_prefix
        ? IvuUI.formTopItem(
            '匹配前缀',
            '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="llm.match_prefix" value="' +
              IvuUI.escapeHtml(llm.match_prefix || '') +
              '" placeholder="/v1/" /></div>',
            true,
          )
        : '');

    // 模型服务商类型下拉
    var providerTypeSelectHtml =
      '<div class="ivu-select ivu-select-single" style="width:100%;">' +
      '<div class="ivu-select-selection">' +
      '<select class="proto-field proto-ivu-select-native" data-field="llm.provider_type" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
      '<option value="">请选择服务商类型</option>' +
      providerTypes
        .map(function (item) {
          return (
            '<option value="' +
            item.type +
            '"' +
            (llm.provider_type === item.type ? ' selected' : '') +
            '>' +
            item.label +
            '</option>'
          );
        })
        .join('') +
      '</select>' +
      '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
      '</div></div>';

    // 价格关联提供商输入
    var priceProviderHtml =
      '<div class="ivu-input-wrapper ivu-input-type-text">' +
      '<input type="text" class="ivu-input proto-field" data-field="llm.price_provider" value="' +
      IvuUI.escapeHtml(llm.price_provider || '') +
      '" placeholder="" />' +
      '</div>';

    // 模型列表接口区域
    var endpointHtml =
      '<div class="endpoint-url-group" style="display:flex;align-items:stretch;gap:0;">' +
      '<div class="ivu-select ivu-select-single endpoint-protocol" style="width:90px;">' +
      '<div class="ivu-select-selection">' +
      '<select class="proto-field proto-ivu-select-native" data-field="llm.model_endpoint.schema" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
      '<option value="http"' +
      (llm.model_endpoint.schema === 'http' ? ' selected' : '') +
      '>http://</option>' +
      '<option value="https"' +
      (llm.model_endpoint.schema === 'https' ? ' selected' : '') +
      '>https://</option>' +
      '</select>' +
      '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
      '</div></div>' +
      '<span class="endpoint-host" title="' +
      IvuUI.escapeHtml(ipStr) +
      '" style="flex:1;border:1px solid #dcdee2;border-left:0;border-right:0;padding:0 10px;background:#f8f8f9;font-size:13px;color:#515a6e;line-height:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
      IvuUI.escapeHtml(ipStr) +
      '</span>' +
      '<div class="ivu-input-wrapper ivu-input-type-text" style="width:180px;">' +
      '<input type="text" class="ivu-input proto-field" data-field="llm.model_endpoint.uri" value="' +
      IvuUI.escapeHtml(llm.model_endpoint.uri || '') +
      '" placeholder="/v1/models" />' +
      '</div>' +
      '</div>' +
      '<button type="button" class="ivu-btn ivu-btn-primary ivu-btn-small" id="cluster-add-header" style="margin-top:14px;margin-bottom:14px;">' +
      '<span>+添加Header</span></button>' +
      '<div class="header-controls">' +
      headerRows +
      '</div>';

    // Key 策略（两列布局）
    var kp = llm.key_policy || {};
    var keyPolicyHtml =
      '<div class="llm-card-title">Key 策略</div>' +
      '<div class="ivu-row" style="margin-left:-12px;margin-right:-12px;">' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '策略',
        '<div class="ivu-select ivu-select-single" style="width:100%;">' +
          '<div class="ivu-select-selection">' +
          '<select class="proto-field proto-ivu-select-native" data-field="llm.key_policy.strategy" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
          '<option value="weighted_random"' +
          (kp.strategy === 'weighted_random' ? ' selected' : '') +
          '>weighted_random</option>' +
          '</select>' +
          '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
          '</div></div>',
      ) +
      '</div>' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '最大重试次数',
        IvuUI.inputNumber(
          kp.max_retries,
          'class="proto-field" data-field="llm.key_policy.max_retries" min="0"',
        ),
      ) +
      '</div>' +
      '</div>' +
      '<div class="ivu-row" style="margin-left:-12px;margin-right:-12px;">' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '初始退避时间(ms)',
        IvuUI.inputNumber(
          kp.retry_backoff_initial,
          'class="proto-field" data-field="llm.key_policy.retry_backoff_initial" min="0"',
        ),
      ) +
      '</div>' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '最大退避时间(ms)',
        IvuUI.inputNumber(
          kp.retry_backoff_max,
          'class="proto-field" data-field="llm.key_policy.retry_backoff_max" min="0"',
        ),
      ) +
      '</div>' +
      '</div>';

    // 组合：模型服务配置
    var modelServiceCard =
      '<div class="llm-card">' +
      '<div class="llm-card-title">模型服务配置</div>' +
      '<div class="llm-card-body">' +
      IvuUI.formTop(
        IvuUI.formTopItem(
          '模型服务商类型' + helpIcon('模型服务商类型说明'),
          providerTypeSelectHtml,
        ) +
          IvuUI.formTopItem(
            '价格关联提供商' + helpIcon('用于模型价格关联的服务商标识'),
            priceProviderHtml,
          ) +
          stripPrefixHtml +
          IvuUI.formTopItem('模型列表接口', endpointHtml) +
          IvuUI.formTopItem('模型', modelSelectHtml, true),
      ) +
      '</div>' +
      '</div>';

    // 模型重定向 Card
    var modelRedirectCard =
      '<div class="llm-card">' +
      '<div class="llm-card-title">模型重定向</div>' +
      '<div class="llm-card-body">' +
      '<table class="mapping-table" style="width:100%;border-collapse:collapse;border:1px solid #e7e9f0;">' +
      '<thead><tr style="background:#f8f8f9;">' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;">原请求的模型名称</th>' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;">转发的后端模型名称</th>' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;width:80px;">操作</th>' +
      '</tr></thead>' +
      '<tbody id="cluster-mapping-body">' +
      mappingRows +
      '</tbody>' +
      '</table>' +
      '<button type="button" class="ivu-btn ivu-btn-primary ivu-btn-small" id="cluster-add-mapping" style="margin-top:20px;">' +
      '<span>+添加</span></button>' +
      '</div>' +
      '</div>';

    // 服务鉴权 Keys Card
    var authKeysCard =
      '<div class="llm-card">' +
      '<div class="llm-card-title">服务鉴权 Keys</div>' +
      '<div class="llm-card-body">' +
      '<table class="keys-table" style="width:100%;border-collapse:collapse;border:1px solid #e7e9f0;">' +
      '<thead><tr style="background:#f8f8f9;">' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;">Key 名称</th>' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;">Key 值</th>' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;width:120px;">权重</th>' +
      '<th style="border:1px solid #e7e9f0;padding:10px 20px;text-align:left;font-weight:500;color:#515a6e;width:80px;">操作</th>' +
      '</tr></thead>' +
      '<tbody id="cluster-keys-body">' +
      keyRows +
      '</tbody>' +
      '</table>' +
      keyWeightTip +
      '<button type="button" class="ivu-btn ivu-btn-primary ivu-btn-small" id="cluster-add-key" style="margin-top:20px;">' +
      '<span>+添加 Key</span></button>' +
      '</div>' +
      '</div>';

    // Key 策略 Card
    var keyPolicyCard =
      '<div class="llm-card">' +
      '<div class="llm-card-body">' +
      keyPolicyHtml +
      '</div>' +
      '</div>';

    return (
      '<div class="gateway-config">' +
      modelServiceCard +
      modelRedirectCard +
      authKeysCard +
      keyPolicyCard +
      '</div>'
    );
  }

  // ============ 复查 & 详情 ============
  function renderReviewPanel(title, rowsHtml) {
    return (
      '<div class="panel"><div class="panel-header">' +
      title +
      '</div><div class="panel-body">' +
      rowsHtml +
      '</div></div>'
    );
  }

  function reviewRow(label, value) {
    return (
      '<ul class="clearFloat"><li class="title">' +
      label +
      ':</li><li class="value">' +
      (value != null && value !== '' ? value : '-') +
      '</li></ul>'
    );
  }

  function renderInstanceReviewTable(instances) {
    if (!instances || !instances.length) {
      return '<span class="empty-text">-</span>';
    }
    var rows = instances
      .map(function (item) {
        var port =
          item.ports && item.ports.Default != null ? item.ports.Default : '-';
        var weight = item.weight != null ? item.weight : '-';
        return (
          '<tr><td>' +
          IvuUI.escapeHtml(item.ip || '-') +
          '</td><td>' +
          IvuUI.escapeHtml(port) +
          '</td><td>' +
          IvuUI.escapeHtml(weight) +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<div class="formBox review-instance-table"><table border="0" cellspacing="0" cellpadding="0">' +
      '<tr><th>IP地址</th><th>端口</th><th>权重</th></tr>' +
      rows +
      '</table></div>'
    );
  }

  function renderReview(data) {
    ensurePrefilledData(data);
    var b = data.baseConfigData;
    var h = data.passiveHealthData;
    var llm = data.llmConfigData;
    var ipStr = getInstanceIpStr(data);
    var providerTypes = getProviderTypes();

    var stickyEnabled =
      b.sticky_sessions && b.sticky_sessions.enabled === 'true';

    var basicRows =
      reviewRow('集群名称', b.name) +
      reviewRow('集群说明', b.description) +
      reviewRow('协议', b.protocol) +
      reviewRow('单个后端最大空闲连接数', b.connection.max_idle_conn_per_rs) +
      reviewRow('会话保持启用', stickyEnabled ? '启用' : '停用') +
      (stickyEnabled
        ? reviewRow('哈希策略', b.sticky_sessions.hash_strategy)
        : '') +
      (stickyEnabled && b.sticky_sessions.hash_strategy !== 'CLIENT_IP_ONLY'
        ? reviewRow('哈希头部', b.sticky_sessions.hash_header)
        : '') +
      reviewRow('请求写缓存大小（Byte）', b.buffers.req_write_buffer_size) +
      reviewRow(
        '后端连接随客户端连接关闭',
        b.connection.cancel_on_client_close === 'true' ? '启用' : '停用',
      );

    var timeoutRows =
      reviewRow(
        '客户端连接空闲超时(ms)',
        b.timeouts.timeout_read_client_again,
      ) +
      reviewRow(
        '读客户端请求Body超时(ms)',
        b.timeouts.timeout_readbody_client,
      ) +
      reviewRow('连接后端超时(ms)', b.timeouts.timeout_conn_serv) +
      reviewRow('读后端响应头部超时(ms)', b.timeouts.timeout_response_header) +
      reviewRow('写客户端响应Body超时(ms)', b.timeouts.timeout_write_client) +
      reviewRow('同集群重试次数', b.retries.max_retry_in_cluster);

    var healthRows =
      reviewRow('故障阈值', h.failnum) +
      reviewRow('健康检查间隔(ms)', h.interval) +
      reviewRow('健康检查Host', h.host) +
      reviewRow('健康检查Uri', h.uri) +
      reviewRow('健康检查期望的状态码', h.statuscode);

    var instanceRows =
      reviewRow(
        '实例形态',
        data.instanceMode === 'domain' ? '服务商域名' : 'IP',
      ) +
      (data.instanceMode === 'domain'
        ? reviewRow('服务商域名', data.domainName)
        : '<ul class="clearFloat detail-row detail-row-block instance-ip-list-row"><li class="title">实例IP列表:</li><li class="value">' +
          renderInstanceReviewTable(data.instancePoolData) +
          '</li></ul>');

    var modelsHtml =
      (llm.models || [])
        .map(function (model) {
          return (
            '<span class="model-tag">' + IvuUI.escapeHtml(model) + '</span>'
          );
        })
        .join('') || '<span class="empty-text">-</span>';

    // 服务商类型文字
    var providerTypeLabel = '-';
    if (llm.provider_type) {
      var pt = providerTypes.find(function (item) {
        return item.type === llm.provider_type;
      });
      providerTypeLabel = pt ? pt.label : llm.provider_type;
    }

    // Header 显示（脱敏）
    var headerDisplay = '-';
    if (data.headerList && data.headerList.length) {
      var hdrs = data.headerList
        .filter(function (h) {
          return h.key;
        })
        .map(function (h) {
          return (
            IvuUI.escapeHtml(h.key) +
            ': ' +
            IvuUI.escapeHtml(maskSecretKey(h.value))
          );
        });
      if (hdrs.length) headerDisplay = hdrs.join('; ');
    }

    // Keys 表格
    var keysHtml = '<span class="empty-text">-</span>';
    if (llm.keys && llm.keys.length) {
      var validKs = llm.keys.filter(function (k) {
        return (k.name && k.name.trim()) || (k.key && k.key.trim());
      });
      if (validKs.length) {
        keysHtml =
          '<table class="mapping-table"><thead><tr><th>Key 名称</th><th>Key 值</th><th>权重</th></tr></thead><tbody>' +
          validKs
            .map(function (item) {
              return (
                '<tr><td>' +
                IvuUI.escapeHtml(item.name || '') +
                '</td><td>' +
                IvuUI.escapeHtml(maskSecretKey(item.key || '')) +
                '</td><td>' +
                IvuUI.escapeHtml(item.weight || 0) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table>';
      }
    }

    // Key 策略
    var kp = llm.key_policy || {};
    var keyPolicyHtml =
      '<ul class="clearFloat detail-row detail-row-block policy-row"><li class="title">Key 策略:</li><li class="value">' +
      '<div class="policy-card" style="border:1px solid #e7e9f0;border-radius:4px;padding:12px;background:#fafafa;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px 24px;">' +
      '<div><span style="color:#515a6e;">策略：</span>' +
      IvuUI.escapeHtml(kp.strategy || 'weighted_random') +
      '</div>' +
      '<div><span style="color:#515a6e;">最大重试次数：</span>' +
      IvuUI.escapeHtml(kp.max_retries != null ? kp.max_retries : 0) +
      '</div>' +
      '<div><span style="color:#515a6e;">初始退避时间(ms)：</span>' +
      IvuUI.escapeHtml(
        kp.retry_backoff_initial != null ? kp.retry_backoff_initial : 500,
      ) +
      '</div>' +
      '<div><span style="color:#515a6e;">最大退避时间(ms)：</span>' +
      IvuUI.escapeHtml(
        kp.retry_backoff_max != null ? kp.retry_backoff_max : 5000,
      ) +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li></ul>';

    var llmRows =
      reviewRow('模型服务商类型', providerTypeLabel) +
      reviewRow('价格关联提供商', llm.price_provider || '-') +
      reviewRow('裁剪前缀', llm.strip_prefix ? '开启' : '关闭') +
      (llm.strip_prefix ? reviewRow('匹配前缀', llm.match_prefix || '-') : '') +
      reviewRow(
        '模型列表接口',
        llm.model_endpoint.schema + '://' + ipStr + llm.model_endpoint.uri,
      ) +
      reviewRow('请求头', headerDisplay) +
      '<ul class="clearFloat detail-row"><li class="title">模型:</li><li class="value">' +
      modelsHtml +
      '</li></ul>' +
      '<ul class="clearFloat detail-row detail-row-block"><li class="title">模型重定向:</li><li class="value">' +
      (llm.model_mappings && llm.model_mappings.length
        ? '<table class="mapping-table"><thead><tr><th>原请求的模型名称</th><th>转发的后端模型名称</th></tr></thead><tbody>' +
          llm.model_mappings
            .map(function (item) {
              return (
                '<tr><td>' +
                IvuUI.escapeHtml(item.source_model || '') +
                '</td><td>' +
                IvuUI.escapeHtml(item.target_model || '') +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table>'
        : '<span class="empty-text">-</span>') +
      '</li></ul>' +
      '<ul class="clearFloat detail-row detail-row-block"><li class="title">服务鉴权 Keys:</li><li class="value">' +
      keysHtml +
      '</li></ul>' +
      keyPolicyHtml;

    return (
      '<div class="Review">' +
      renderReviewPanel('基本配置', basicRows) +
      renderReviewPanel('超时和重传', timeoutRows) +
      renderReviewPanel('被动健康检查', healthRows) +
      renderReviewPanel('实例配置', instanceRows) +
      renderReviewPanel('大模型配置', llmRows) +
      '</div>'
    );
  }

  // ============ 数据同步 ============
  function setNestedValue(obj, path, value) {
    var parts = path.split('.');
    var current = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  function syncFromDom(root, data) {
    root.querySelectorAll('.proto-field').forEach(function (field) {
      var path = field.getAttribute('data-field');
      if (!path) return;
      var value;
      if (field.tagName === 'SELECT' && field.multiple) {
        value = Array.from(field.selectedOptions).map(function (opt) {
          return opt.value;
        });
      } else if (field.tagName === 'SELECT') {
        value = field.value;
      } else if (field.type === 'number') {
        value = field.value === '' ? null : Number(field.value);
      } else if (field.type === 'checkbox') {
        value = field.checked;
      } else {
        value = field.value;
      }

      // strip_prefix 特殊处理：转为 boolean
      if (path === 'llm.strip_prefix') {
        value = value === 'true';
      }

      if (path.indexOf('base.') === 0)
        setNestedValue(data.baseConfigData, path.slice(5), value);
      else if (path.indexOf('health.') === 0)
        data.passiveHealthData[path.slice(7)] = value;
      else if (path === 'instanceMode') data.instanceMode = value;
      else if (path === 'domainName') data.domainName = value;
      else if (path.indexOf('llm.') === 0) {
        var key = path.slice(4);
        if (key.indexOf('model_endpoint.') === 0) {
          if (!data.llmConfigData.model_endpoint)
            data.llmConfigData.model_endpoint = {};
          data.llmConfigData.model_endpoint[key.slice(15)] = value;
        } else if (key.indexOf('key_policy.') === 0) {
          if (!data.llmConfigData.key_policy)
            data.llmConfigData.key_policy = {};
          data.llmConfigData.key_policy[key.slice(11)] = value;
        } else if (key === 'strip_prefix') {
          data.llmConfigData.strip_prefix = value;
        } else {
          data.llmConfigData[key] = value;
        }
      }
    });

    // 实例列表
    if (data.instanceMode !== 'domain') {
      var ipInputs = root.querySelectorAll('.proto-instance-ip');
      if (ipInputs.length) {
        data.instancePoolData = [];
        ipInputs.forEach(function (input) {
          var index = parseInt(input.getAttribute('data-index'), 10);
          var portInput = root.querySelector(
            '.proto-instance-port[data-index="' + index + '"]',
          );
          var weightInput = root.querySelector(
            '.proto-instance-weight[data-index="' + index + '"]',
          );
          data.instancePoolData.push({
            ip: input.value.trim(),
            ports: { Default: portInput ? Number(portInput.value) : 80 },
            hostname: '',
            weight: weightInput
              ? weightInput.value === ''
                ? 0
                : Number(weightInput.value)
              : 100,
            tags: { key: 'value' },
          });
        });
      }
    }

    // Header 列表
    data.headerList = [];
    root.querySelectorAll('.header-pair').forEach(function (pair, index) {
      var keyInput = pair.querySelector('.proto-header-key');
      var valueInput = pair.querySelector('.proto-header-value');
      data.headerList.push({
        key: keyInput ? keyInput.value : '',
        value: valueInput ? valueInput.value : '',
        originalValue: pair.getAttribute('data-original-value') || '',
        valueModified: pair.getAttribute('data-modified') === 'true',
      });
    });

    // 模型映射
    data.llmConfigData.model_mappings = [];
    root.querySelectorAll('[data-mapping-index]').forEach(function (row) {
      var keyInput = row.querySelector('.proto-mapping-key');
      var valueSelect = row.querySelector('.proto-mapping-value');
      data.llmConfigData.model_mappings.push({
        source_model: keyInput ? keyInput.value : '',
        target_model: valueSelect ? valueSelect.value : '',
      });
    });

    // Keys 表格
    data.llmConfigData.keys = [];
    root.querySelectorAll('[data-key-index]').forEach(function (row) {
      var nameInput = row.querySelector('.proto-key-name');
      var valueInput = row.querySelector('.proto-key-value');
      var weightInput = row.querySelector('.proto-key-weight');
      data.llmConfigData.keys.push({
        name: nameInput ? nameInput.value : '',
        key: valueInput ? valueInput.value : '',
        weight: weightInput
          ? weightInput.value === ''
            ? 0
            : Number(weightInput.value)
          : 0,
      });
    });
  }

  // ============ 校验 ============
  function validateStep0(data, isAdd, clusterNames) {
    var b = data.baseConfigData;
    var name = (b.name || '').trim();
    if (!name) {
      return '请输入集群名称';
    }
    if (!validateClusterNameFormat(name)) {
      return '集群名称格式不正确：1-64个字符，以字母或数字开头，支持字母、数字、下划线、连字符、点';
    }
    if (isAdd) {
      var names = clusterNames || [];
      if (names.indexOf(name) !== -1) {
        return '集群名称已存在，请更换名称';
      }
    }
    if (!validateDescription(b.description || '')) {
      return '集群说明长度不能超过 256 个字符，且不能包含控制字符';
    }
    if (
      b.sticky_sessions &&
      b.sticky_sessions.enabled === 'true' &&
      b.sticky_sessions.hash_strategy !== 'CLIENT_IP_ONLY'
    ) {
      if (
        !b.sticky_sessions.hash_header ||
        !b.sticky_sessions.hash_header.trim()
      ) {
        return '请输入哈希头部';
      }
    }
    return null;
  }

  function validateStep3(data) {
    if (data.instanceMode === 'domain') {
      if (!data.domainName || !data.domainName.trim()) {
        return '请输入服务商域名';
      }
      return null;
    }
    var instances = data.instancePoolData || [];
    if (!instances.length) return '至少需要一个实例';

    // IP + 端口 非空 & 组合重复校验
    var ipPortSet = {};
    for (var i = 0; i < instances.length; i++) {
      var ip = (instances[i].ip || '').trim();
      var port =
        instances[i].port || (instances[i].ports && instances[i].ports.Default);
      if (!ip) return '第 ' + (i + 1) + ' 行请输入 IP 地址';
      var key = ip + ':' + port;
      if (ipPortSet[key]) return '实例重复：' + ip + ':' + port;
      ipPortSet[key] = true;
    }

    // 权重总和校验
    var weightSum = instances.reduce(function (sum, item) {
      return sum + (Number(item.weight) || 0);
    }, 0);
    if (weightSum !== 100) {
      return '所有实例权重之和必须等于 100，当前为 ' + weightSum;
    }

    return null;
  }

  function validateStep4(data) {
    var llm = data.llmConfigData;

    // 裁剪前缀时匹配前缀必填
    if (llm.strip_prefix) {
      if (!llm.match_prefix || !llm.match_prefix.trim()) {
        return '开启裁剪前缀时，匹配前缀必填';
      }
      if (!llm.match_prefix.endsWith('/')) {
        return '匹配前缀必须以 / 结尾';
      }
    }

    // 模型多选至少选一个
    if (!llm.models || !llm.models.length) {
      return '请至少选择一个模型';
    }

    // Key 名称重复校验
    var keys = llm.keys || [];
    var validKeys = keys.filter(function (k) {
      return (k.name && k.name.trim()) || (k.key && k.key.trim());
    });
    var nameSet = {};
    for (var i = 0; i < validKeys.length; i++) {
      var nm = (validKeys[i].name || '').trim();
      if (nm) {
        if (nameSet[nm]) return 'Key 名称不能重复：' + nm;
        nameSet[nm] = true;
      }
    }

    // Key 权重总和校验
    if (validKeys.length > 0) {
      var keyWeightSum = validKeys.reduce(function (sum, k) {
        return sum + (Number(k.weight) || 0);
      }, 0);
      if (keyWeightSum !== 100) {
        return '所有有效 Key 的权重之和必须等于 100，当前为 ' + keyWeightSum;
      }
    }

    // Key 策略退避时间校验
    var kp = llm.key_policy || {};
    var initial = Number(kp.retry_backoff_initial);
    var maxB = Number(kp.retry_backoff_max);
    if (!isNaN(initial) && !isNaN(maxB) && maxB < initial) {
      return '最大退避时间必须大于或等于初始退避时间';
    }

    return null;
  }

  // ============ 步骤按钮 ============
  function renderActionButtons(currentStep, reviewStepIndex) {
    return (
      (currentStep === reviewStepIndex
        ? IvuUI.btn(
            '提交',
            'primary',
            'small',
            '',
            'id="cluster-upsert-submit"',
          )
        : IvuUI.btn(
            '下一步',
            'primary',
            'small',
            '',
            'id="cluster-upsert-next"',
          )) +
      (currentStep !== 0
        ? IvuUI.btn(
            '上一步',
            'default',
            'small',
            '',
            'id="cluster-upsert-prev"',
          )
        : '')
    );
  }

  // ============ mount ============
  function mount(bodyEl, footerEl, options) {
    options = options || {};
    var state = {
      currentStep: 0,
      isAdd: options.isAdd !== false,
      data: createDefaultData(options.row),
      reviewStepIndex: STEP_DEFS.length - 1,
      clusterNames: options.clusterNames || [],
    };

    function renderStepContent() {
      switch (state.currentStep) {
        case 0:
          return renderBaseConfig(state.data, state.isAdd, state.clusterNames);
        case 1:
          return renderTimeout(state.data);
        case 2:
          return renderPassiveHealth(state.data);
        case 3:
          return renderInstancePool(state.data);
        case 4:
          return renderGatewayConfig(state.data);
        case 5:
          return renderReview(state.data);
        default:
          return '';
      }
    }

    function renderBody() {
      bodyEl.innerHTML =
        '<div class="newClusters">' +
        '<div id="cluster-step-content">' +
        renderStepContent() +
        '</div>' +
        '<footer class="cluster-steps-footer"><div class="ivu-steps ivu-steps-horizontal">' +
        IvuUI.clusterSteps(STEP_DEFS, state.currentStep) +
        '</div></footer>' +
        '</div>';
    }

    function renderFooter() {
      if (!footerEl) return;
      footerEl.innerHTML =
        '<div class="com-btn-box drawer-footer">' +
        renderActionButtons(state.currentStep, state.reviewStepIndex) +
        '</div>';
    }

    function render() {
      renderBody();
      renderFooter();
      bindEvents();
    }

    function bindEvents() {
      var scope = footerEl || bodyEl;
      var nextBtn = scope.querySelector('#cluster-upsert-next');
      if (nextBtn)
        nextBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);

          // 步骤校验
          var err = null;
          if (state.currentStep === 0) {
            err = validateStep0(state.data, state.isAdd, state.clusterNames);
          } else if (state.currentStep === 3) {
            err = validateStep3(state.data);
          } else if (state.currentStep === 4) {
            err = validateStep4(state.data);
          }
          if (err) {
            Prototype.toast(err, 'error');
            return;
          }

          state.currentStep += 1;
          render();
        });

      var prevBtn = scope.querySelector('#cluster-upsert-prev');
      if (prevBtn)
        prevBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.currentStep -= 1;
          render();
        });

      var submitBtn = scope.querySelector('#cluster-upsert-submit');
      if (submitBtn)
        submitBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (typeof options.onSubmit === 'function')
            options.onSubmit(state.data);
        });

      // 基本配置：会话保持开关切换
      var stickyEnabledSelect = bodyEl.querySelector(
        '[data-field="base.sticky_sessions.enabled"]',
      );
      if (stickyEnabledSelect)
        stickyEnabledSelect.addEventListener('change', function () {
          syncFromDom(bodyEl, state.data);
          render();
        });

      // 哈希策略切换
      var hashStrategySelect = bodyEl.querySelector(
        '[data-field="base.sticky_sessions.hash_strategy"]',
      );
      if (hashStrategySelect)
        hashStrategySelect.addEventListener('change', function () {
          syncFromDom(bodyEl, state.data);
          render();
        });

      // 实例形态切换
      var modeSelect = bodyEl.querySelector('#cluster-instance-mode');
      if (modeSelect)
        modeSelect.addEventListener('change', function () {
          syncFromDom(bodyEl, state.data);
          render();
        });

      // 添加实例
      var addInstanceBtn = bodyEl.querySelector('#cluster-add-instance');
      if (addInstanceBtn)
        addInstanceBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.instancePoolData.push({
            ip: '',
            ports: { Default: 80 },
            hostname: '',
            weight: 0,
            tags: { key: 'value' },
          });
          render();
        });

      // 删除实例
      bodyEl
        .querySelectorAll('[data-action="remove-instance"]')
        .forEach(function (btn) {
          btn.addEventListener('click', function () {
            syncFromDom(bodyEl, state.data);
            var index = parseInt(btn.getAttribute('data-index'), 10);
            state.data.instancePoolData.splice(index, 1);
            render();
          });
        });

      // 实例权重/IP 实时变化提示更新
      bodyEl
        .querySelectorAll('.proto-instance-weight, .proto-instance-ip')
        .forEach(function (input) {
          input.addEventListener('input', function () {
            // 不重新渲染，只更新数据状态（点击下一步时会再同步）
          });
        });

      // 添加 Header
      var addHeaderBtn = bodyEl.querySelector('#cluster-add-header');
      if (addHeaderBtn)
        addHeaderBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (!state.data.headerList) state.data.headerList = [];
          state.data.headerList.push({
            key: '',
            value: '',
            originalValue: '',
            valueModified: false,
          });
          render();
        });

      // 删除 Header
      bodyEl
        .querySelectorAll('[data-action="remove-header"]')
        .forEach(function (btn) {
          btn.addEventListener('click', function () {
            syncFromDom(bodyEl, state.data);
            state.data.headerList.splice(
              parseInt(btn.getAttribute('data-index'), 10),
              1,
            );
            render();
          });
        });

      // Header Value 焦点脱敏逻辑：聚焦时若为掩码则清空
      bodyEl.querySelectorAll('.proto-header-value').forEach(function (input) {
        input.addEventListener('focus', function () {
          // 简单 mock：如果值包含 ****，认为是掩码，聚焦清空
          if (input.value.indexOf('****') !== -1) {
            input.value = '';
          }
        });
      });

      // 添加映射
      var addMappingBtn = bodyEl.querySelector('#cluster-add-mapping');
      if (addMappingBtn)
        addMappingBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (!state.data.llmConfigData.model_mappings)
            state.data.llmConfigData.model_mappings = [];
          state.data.llmConfigData.model_mappings.push({
            source_model: '',
            target_model: '',
          });
          render();
        });

      // 删除映射
      bodyEl
        .querySelectorAll('[data-action="remove-mapping"]')
        .forEach(function (btn) {
          btn.addEventListener('click', function () {
            syncFromDom(bodyEl, state.data);
            state.data.llmConfigData.model_mappings.splice(
              parseInt(btn.getAttribute('data-index'), 10),
              1,
            );
            render();
          });
        });

      // 获取模型
      var queryModelsBtn = bodyEl.querySelector('#cluster-query-models');
      if (queryModelsBtn)
        queryModelsBtn.addEventListener('click', function () {
          Prototype.toast('获取模型列表成功');
        });

      // 裁剪前缀切换（switch 开关）
      var stripPrefixSwitch = bodyEl.querySelector(
        '#proto-strip-prefix-switch',
      );
      if (stripPrefixSwitch)
        stripPrefixSwitch.addEventListener('click', function () {
          state.data.llmConfigData.strip_prefix =
            !state.data.llmConfigData.strip_prefix;
          if (!state.data.llmConfigData.strip_prefix) {
            state.data.llmConfigData.match_prefix = '';
          }
          render();
        });

      // 添加 Key
      var addKeyBtn = bodyEl.querySelector('#cluster-add-key');
      if (addKeyBtn)
        addKeyBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (!state.data.llmConfigData.keys)
            state.data.llmConfigData.keys = [];
          state.data.llmConfigData.keys.push({ name: '', key: '', weight: 0 });
          render();
        });

      // 删除 Key
      bodyEl
        .querySelectorAll('[data-action="remove-key"]')
        .forEach(function (btn) {
          btn.addEventListener('click', function () {
            syncFromDom(bodyEl, state.data);
            state.data.llmConfigData.keys.splice(
              parseInt(btn.getAttribute('data-index'), 10),
              1,
            );
            render();
          });
        });
    }

    render();

    return {
      getData: function () {
        return state.data;
      },
    };
  }

  return {
    createDefaultData: createDefaultData,
    renderReview: renderReview,
    mount: mount,
  };
})();
