window.ClusterUpsert = (function () {
  var STEP_DEFS = [
    { content: '基本配置' },
    { content: '超时和重传' },
    { content: '被动健康检查' },
    { content: '实例配置' },
    { content: '大模型配置' },
    { content: '复查&检查' }
  ];

  var PROVIDERS = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure OpenAI' },
    { id: 'anthropic', name: 'Anthropic' }
  ];

  var ALL_MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'deepseek-chat'];

  function cloneInstance(item) {
    return {
      ip: item.ip || '',
      ports: { Default: item.port != null ? item.port : (item.ports && item.ports.Default != null ? item.ports.Default : 80) },
      hostname: item.hostname || '',
      weight: item.weight != null ? item.weight : 1,
      tags: item.tags || { key: 'value' }
    };
  }

  function getDefaultInstances() {
    var list = (window.MockData && MockData.clusterInstances) || [];
    var instances = list.filter(function (item) { return item.ip; }).map(cloneInstance);
    if (instances.length) return instances;
    return [
      { ip: '172.18.1.140', ports: { Default: 16516 }, hostname: '', weight: 1, tags: { key: 'value' } },
      { ip: '172.18.1.140', ports: { Default: 16517 }, hostname: '', weight: 1, tags: { key: 'value' } },
      { ip: '172.18.1.140', ports: { Default: 16518 }, hostname: '', weight: 1, tags: { key: 'value' } }
    ];
  }

  function ensurePrefilledData(data) {
    if (!data.instancePoolData || !data.instancePoolData.length) {
      data.instancePoolData = getDefaultInstances();
    }
    if (!data.headerList || !data.headerList.length) {
      data.headerList = [{ key: 'Authorization', value: 'Bearer sk-****' }];
    }
    if (!data.llmConfigData.model_mappings || !data.llmConfigData.model_mappings.length) {
      data.llmConfigData.model_mappings = [{ key: 'gpt-4-turbo', value: 'gpt-4o' }];
    }
    if (!data.llmConfigData.models || !data.llmConfigData.models.length) {
      data.llmConfigData.models = ['gpt-4o'];
    }
  }

  function getInstanceIpStr(data) {
    ensurePrefilledData(data);
    return data.instancePoolData.map(function (item) {
      var port = item.ports && item.ports.Default != null ? item.ports.Default : 80;
      return (item.ip || '') + ':' + port;
    }).filter(function (line) { return line !== ':'; }).join('\n');
  }

  function renderModelSingleSelect(selectedModels) {
    var selected = (selectedModels && selectedModels.length) ? selectedModels[0] : '';
    var merged = ALL_MODELS.slice();
    if (selected && merged.indexOf(selected) === -1) merged.unshift(selected);
    var options = merged.map(function (model) {
      return '<option value="' + IvuUI.escapeHtml(model) + '"' + (model === selected ? ' selected' : '') + '>' + IvuUI.escapeHtml(model) + '</option>';
    }).join('');
    return '<div class="ivu-select ivu-select-single model-single-select">' +
      '<div class="ivu-select-selection">' +
      '<select class="proto-field" data-field="llm.model">' +
      '<option value="">请选择模型</option>' + options +
      '</select></div></div>';
  }

  function createDefaultData(row) {
    row = row || {};
    return {
      baseConfigData: {
        name: row.name || '',
        description: row.description || '',
        protocol: 'http',
        connection: {
          max_idle_conn_per_rs: 0,
          cancel_on_client_close: 'false'
        },
        buffers: { req_write_buffer_size: 512 },
        sticky_sessions: {
          session_sticky_type: 'INSTANCE',
          hash_strategy: 'CLIENT_ID_ONLY',
          hash_header: 'Cookie:USERID'
        },
        timeouts: {
          timeout_conn_serv: 2000,
          timeout_response_header: 60000,
          timeout_readbody_client: 30000,
          timeout_read_client_again: 60000,
          timeout_write_client: 60000
        },
        retries: {
          max_retry_in_subcluster: 2,
          max_retry_cross_subcluster: 0
        }
      },
      passiveHealthData: {
        interval: 1000,
        failnum: 10,
        host: 'example.com',
        uri: '/health',
        statuscode: 200
      },
      instanceMode: 'ip',
      domainName: '',
      instancePoolData: getDefaultInstances(),
      llmConfigData: {
        service_name: 'llm-service',
        group: 'default',
        provider_type: 'openai',
        model_endpoint: {
          schema: 'https',
          uri: '/v1/models',
          headers: {}
        },
        models: ['gpt-4o'],
        model_mappings: [{ key: 'gpt-4-turbo', value: 'gpt-4o' }],
        keyInput: '',
        key: ''
      },
      headerList: [{ key: 'Authorization', value: 'Bearer sk-****' }]
    };
  }

  function renderBaseConfig(data, isAdd) {
    var b = data.baseConfigData;
    var hashHeaderBlock = b.sticky_sessions.hash_strategy !== 'CLIENT_IP_ONLY'
      ? IvuUI.formTopItem('哈希头部',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.sticky_sessions.hash_header" value="' +
        IvuUI.escapeHtml(b.sticky_sessions.hash_header) + '" /></div>', true)
      : '';

    return IvuUI.formTop(
      IvuUI.formTopItem('集群名称',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.name" value="' +
        IvuUI.escapeHtml(b.name) + '" ' + (isAdd ? '' : 'disabled="disabled" ') + '/></div>', true) +
      IvuUI.formTopItem('集群说明',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="base.description" value="' +
        IvuUI.escapeHtml(b.description) + '" /></div>') +
      IvuUI.formTopItem('协议',
        '<select class="proto-field from-item-inp" data-field="base.protocol" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        '<option value="http"' + (b.protocol === 'http' ? ' selected' : '') + '>http</option>' +
        '<option value="https"' + (b.protocol === 'https' ? ' selected' : '') + '>https</option>' +
        '</select>', true) +
      IvuUI.formTopItem('单个后端最大空闲连接数',
        IvuUI.inputNumber(b.connection.max_idle_conn_per_rs, 'class="proto-field" data-field="base.connection.max_idle_conn_per_rs" min="0"'), true) +
      IvuUI.formTopItem('哈希策略',
        '<select class="proto-field from-item-inp" data-field="base.sticky_sessions.hash_strategy" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        ['CLIENT_ID_ONLY', 'CLIENT_IP_ONLY', 'CLIENT_ID_PREFERED'].map(function (item) {
          return '<option value="' + item + '"' + (b.sticky_sessions.hash_strategy === item ? ' selected' : '') + '>' + item + '</option>';
        }).join('') + '</select>', true) +
      hashHeaderBlock +
      IvuUI.formTopItem('会话保持级别',
        '<select class="proto-field from-item-inp" data-field="base.sticky_sessions.session_sticky_type" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        '<option value="INSTANCE"' + (b.sticky_sessions.session_sticky_type === 'INSTANCE' ? ' selected' : '') + '>INSTANCE</option>' +
        '<option value="SUB_CLUSTER"' + (b.sticky_sessions.session_sticky_type === 'SUB_CLUSTER' ? ' selected' : '') + '>SUB_CLUSTER</option>' +
        '</select>', true) +
      IvuUI.formTopItem('请求写缓存大小（Byte）',
        IvuUI.inputNumber(b.buffers.req_write_buffer_size, 'class="proto-field" data-field="base.buffers.req_write_buffer_size" min="0"'), true) +
      IvuUI.formTopItem('后端连接随客户端连接关闭 ',
        '<select class="proto-field from-item-inp" data-field="base.connection.cancel_on_client_close" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        '<option value="true"' + (b.connection.cancel_on_client_close === 'true' ? ' selected' : '') + '>启用</option>' +
        '<option value="false"' + (b.connection.cancel_on_client_close === 'false' ? ' selected' : '') + '>停用</option>' +
        '</select>', true)
    );
  }

  function renderTimeout(data) {
    var t = data.baseConfigData.timeouts;
    var r = data.baseConfigData.retries;
    return IvuUI.formTop(
      IvuUI.formTopItem('客户端连接空闲超时(ms) ', IvuUI.inputNumber(t.timeout_read_client_again, 'class="proto-field" data-field="base.timeouts.timeout_read_client_again" min="0"'), true) +
      IvuUI.formTopItem('读客户端请求Body超时(ms)', IvuUI.inputNumber(t.timeout_readbody_client, 'class="proto-field" data-field="base.timeouts.timeout_readbody_client" min="0"'), true) +
      IvuUI.formTopItem('连接后端超时(ms) ', IvuUI.inputNumber(t.timeout_conn_serv, 'class="proto-field" data-field="base.timeouts.timeout_conn_serv" min="0"'), true) +
      IvuUI.formTopItem('读后端响应头部超时(ms) ', IvuUI.inputNumber(t.timeout_response_header, 'class="proto-field" data-field="base.timeouts.timeout_response_header" min="0"'), true) +
      IvuUI.formTopItem('写客户端响应Body超时(ms)', IvuUI.inputNumber(t.timeout_write_client, 'class="proto-field" data-field="base.timeouts.timeout_write_client" min="0"'), true) +
      IvuUI.formTopItem('同子集群重试次数', IvuUI.inputNumber(r.max_retry_in_subcluster, 'class="proto-field" data-field="base.retries.max_retry_in_subcluster" min="0"'), true) +
      IvuUI.formTopItem('跨子集群重试次数', IvuUI.inputNumber(r.max_retry_cross_subcluster, 'class="proto-field" data-field="base.retries.max_retry_cross_subcluster" min="0"'), true)
    );
  }

  function renderPassiveHealth(data) {
    var h = data.passiveHealthData;
    return '<div class="health-check">' + IvuUI.formTop(
      IvuUI.formTopItem('故障阈值（触发设置实例为不可用，启动被动健康检查）', IvuUI.inputNumber(h.failnum, 'class="proto-field from-item-inp" data-field="health.failnum" min="0"'), true) +
      IvuUI.formTopItem('健康检查间隔(ms)', IvuUI.inputNumber(h.interval, 'class="proto-field from-item-inp" data-field="health.interval" min="0"'), true) +
      IvuUI.formTopItem('健康检查Host',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="health.host" value="' +
        IvuUI.escapeHtml(h.host) + '" placeholder="example.com" /></div>', true) +
      IvuUI.formTopItem('健康检查Uri',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="health.uri" value="' +
        IvuUI.escapeHtml(h.uri) + '" placeholder="/example" /></div>', true) +
      IvuUI.formTopItem('健康检查期望的状态码', IvuUI.inputNumber(h.statuscode, 'class="proto-field from-item-inp" data-field="health.statuscode" min="0"'), true)
    ) + '</div>';
  }

  function renderInstancePool(data) {
    ensurePrefilledData(data);
    var rows = data.instancePoolData.map(function (item, index) {
      return '<tr data-instance-index="' + index + '">' +
        '<td><div class="ivu-input-wrapper ivu-input-type-text">' +
          '<input type="text" class="ivu-input proto-instance-ip" data-index="' + index + '" value="' + IvuUI.escapeHtml(item.ip) + '" placeholder="请输入IP地址" />' +
        '</div></td>' +
        '<td>' +
          '<div class="ivu-input-number poolInput" style="width:80px;display:inline-block;vertical-align:middle;">' +
            '<input type="number" class="ivu-input-number-input proto-instance-port" data-index="' + index + '" min="1" max="65535" value="' + (item.ports.Default != null ? item.ports.Default : 80) + '" placeholder="端口值" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;" />' +
          '</div>' +
        '</td>' +
        '<td>' + IvuUI.btn('删除', 'error', 'small', '', 'data-action="remove-instance" data-index="' + index + '" ' + (data.instancePoolData.length <= 1 ? 'disabled="disabled"' : '')) + '</td>' +
      '</tr>';
    }).join('');

    return IvuUI.formTop(
      IvuUI.formTopItem('实例形态',
        '<select id="cluster-instance-mode" class="proto-field" data-field="instanceMode" style="width:240px;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        '<option value="ip"' + (data.instanceMode === 'ip' ? ' selected' : '') + '>IP</option>' +
        '<option value="domain"' + (data.instanceMode === 'domain' ? ' selected' : '') + '>服务商域名</option>' +
        '</select>') +
      (data.instanceMode === 'domain'
        ? IvuUI.formTopItem('服务商域名',
          '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="domainName" id="cluster-domain-name" value="' +
          IvuUI.escapeHtml(data.domainName) + '" placeholder="请输入服务商域名，例如 example.com" /></div>')
        : IvuUI.formTopItem('实例IP列表',
          '<div class="formBox"><table border="0" cellspacing="0" cellpadding="0">' +
            '<tr><th>IP地址</th><th>端口</th><th>操作</th></tr>' + rows +
          '</table></div>' +
          IvuUI.btn('+创建', 'primary', 'small', '', 'id="cluster-add-instance" style="margin-top:8px;"')))
    );
  }

  function renderGatewayConfig(data) {
    ensurePrefilledData(data);
    var llm = data.llmConfigData;
    var ipStr = getInstanceIpStr(data);

    var headerRows = (data.headerList || []).map(function (header, index) {
      return '<div class="header-pair" data-header-index="' + index + '">' +
        '<input class="ivu-input header-input proto-header-key" data-index="' + index + '" value="' + IvuUI.escapeHtml(header.key) + '" placeholder="Header Key" />' +
        '<span class="header-separator">:</span>' +
        '<input class="ivu-input header-input proto-header-value" data-index="' + index + '" value="' + IvuUI.escapeHtml(header.value) + '" placeholder="Header Value" />' +
        IvuUI.btn('-', 'error', 'small', '', 'data-action="remove-header" data-index="' + index + '"') +
      '</div>';
    }).join('');

    var mappingRows = (llm.model_mappings || []).map(function (mapping, index) {
      return '<tr data-mapping-index="' + index + '">' +
        '<td><input class="ivu-input proto-mapping-key" data-index="' + index + '" value="' + IvuUI.escapeHtml(mapping.key) + '" placeholder="请输入原模型名称" /></td>' +
        '<td><select class="proto-mapping-value" data-index="' + index + '" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
          '<option value="">请选择目标模型</option>' +
          (llm.models || []).map(function (model) {
            return '<option value="' + IvuUI.escapeHtml(model) + '"' + (mapping.value === model ? ' selected' : '') + '>' + IvuUI.escapeHtml(model) + '</option>';
          }).join('') +
        '</select></td>' +
        '<td>' + IvuUI.btn('删除', 'error', 'small', '', 'data-action="remove-mapping" data-index="' + index + '"') + '</td>' +
      '</tr>';
    }).join('');

    return '<div class="gateway-config">' + IvuUI.formTop(
      IvuUI.formTopItem('服务名称',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="llm.service_name" value="' +
        IvuUI.escapeHtml(llm.service_name) + '" /></div>', true) +
      IvuUI.formTopItem('分组',
        '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input proto-field" data-field="llm.group" value="' +
        IvuUI.escapeHtml(llm.group) + '" /></div>', true) +
      IvuUI.formTopItem('模型服务商',
        '<select class="proto-field from-item-inp" data-field="llm.provider_type" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
        PROVIDERS.map(function (item) {
          return '<option value="' + item.id + '"' + (llm.provider_type === item.id ? ' selected' : '') + '>' + item.name + '</option>';
        }).join('') + '</select>', true) +
      IvuUI.formTopItem('模型列表接口',
        '<div class="endpoint-row flex">' +
          '<select class="item endpoint-schema proto-field" data-field="llm.model_endpoint.schema">' +
            '<option value="http"' + (llm.model_endpoint.schema === 'http' ? ' selected' : '') + '>http</option>' +
            '<option value="https"' + (llm.model_endpoint.schema === 'https' ? ' selected' : '') + '>https</option>' +
          '</select>' +
          '<textarea class="item endpoint-ip-list proto-readonly-ip" rows="4" readonly="readonly">' + IvuUI.escapeHtml(ipStr) + '</textarea>' +
          '<div class="item endpoint-uri-wrap">' +
            '<input class="ivu-input proto-field" data-field="llm.model_endpoint.uri" value="' + IvuUI.escapeHtml(llm.model_endpoint.uri) + '" placeholder="/v1/models" />' +
          '</div>' +
        '</div>' +
        IvuUI.btn('+创建Header', 'primary', 'small', '', 'id="cluster-add-header" style="margin-top:12px;"') +
        '<div class="header-controls"><div class="header-pairs">' + headerRows + '</div></div>') +
      IvuUI.formTopItem('模型',
        '<div class="model-select-row">' +
          renderModelSingleSelect(llm.models) +
          IvuUI.btn('获取', 'primary', 'default', '', 'id="cluster-query-models"') +
        '</div>', true) +
      IvuUI.formTopItem('模型重定向',
        '<table class="mapping-table"><thead><tr><th>原请求的模型名称</th><th>转发的后端模型名称</th><th>操作</th></tr></thead><tbody id="cluster-mapping-body">' +
          mappingRows +
        '</tbody></table>' +
        IvuUI.btn('+添加', 'primary', 'small', '', 'id="cluster-add-mapping" style="margin-top:12px;"')) +
      IvuUI.formTopItem('服务鉴权Key',
        '<input class="ivu-input proto-field" data-field="llm.keyInput" value="' + IvuUI.escapeHtml(llm.keyInput) + '" placeholder="请输入服务鉴权 Key" autocomplete="new-password" />')
    ) + '</div>';
  }

  function renderReviewPanel(title, rowsHtml) {
    return '<div class="panel"><div class="panel-header">' + title + '</div><div class="panel-body">' + rowsHtml + '</div></div>';
  }

  function reviewRow(label, value) {
    return '<ul class="clearFloat"><li class="title">' + label + ':</li><li class="value">' + (value != null && value !== '' ? value : '-') + '</li></ul>';
  }

  function renderInstanceReviewTable(instances) {
    if (!instances || !instances.length) {
      return '<span class="empty-text">-</span>';
    }
    var rows = instances.map(function (item) {
      var port = item.ports && item.ports.Default != null ? item.ports.Default : '-';
      return '<tr><td>' + IvuUI.escapeHtml(item.ip || '-') + '</td><td>' + IvuUI.escapeHtml(port) + '</td></tr>';
    }).join('');
    return '<div class="formBox review-instance-table"><table border="0" cellspacing="0" cellpadding="0">' +
      '<tr><th>IP地址</th><th>端口</th></tr>' + rows + '</table></div>';
  }

  function renderReview(data) {
    ensurePrefilledData(data);
    var b = data.baseConfigData;
    var h = data.passiveHealthData;
    var llm = data.llmConfigData;
    var ipStr = getInstanceIpStr(data);

    var basicRows =
      reviewRow('集群名称', b.name) +
      reviewRow('集群说明', b.description) +
      reviewRow('协议', b.protocol) +
      reviewRow('单个后端最大空闲连接数', b.connection.max_idle_conn_per_rs) +
      reviewRow('哈希策略', b.sticky_sessions.hash_strategy) +
      (b.sticky_sessions.hash_strategy !== 'CLIENT_IP_ONLY' ? reviewRow('哈希头部', b.sticky_sessions.hash_header) : '') +
      reviewRow('会话保持级别', b.sticky_sessions.session_sticky_type) +
      reviewRow('请求写缓存大小（Byte）', b.buffers.req_write_buffer_size) +
      reviewRow('后端连接随客户端连接关闭', b.connection.cancel_on_client_close === 'true' ? '启用' : '停用');

    var timeoutRows =
      reviewRow('客户端连接空闲超时(ms)', b.timeouts.timeout_read_client_again) +
      reviewRow('读客户端请求Body超时(ms)', b.timeouts.timeout_readbody_client) +
      reviewRow('连接后端超时(ms)', b.timeouts.timeout_conn_serv) +
      reviewRow('读后端响应头部超时(ms)', b.timeouts.timeout_response_header) +
      reviewRow('写客户端响应Body超时(ms)', b.timeouts.timeout_write_client) +
      reviewRow('同子集群重试次数', b.retries.max_retry_in_subcluster) +
      reviewRow('跨子集群重试次数', b.retries.max_retry_cross_subcluster);

    var healthRows =
      reviewRow('故障阈值', h.failnum) +
      reviewRow('健康检查间隔(ms)', h.interval) +
      reviewRow('健康检查Host', h.host) +
      reviewRow('健康检查Uri', h.uri) +
      reviewRow('健康检查期望的状态码', h.statuscode);

    var instanceRows =
      reviewRow('实例形态', data.instanceMode === 'domain' ? '服务商域名' : 'IP') +
      (data.instanceMode === 'domain'
        ? reviewRow('服务商域名', data.domainName)
        : '<ul class="clearFloat detail-row detail-row-block instance-ip-list-row"><li class="title">实例IP列表:</li><li class="value">' +
          renderInstanceReviewTable(data.instancePoolData) + '</li></ul>');

    var modelsHtml = (llm.models || []).map(function (model) {
      return '<span class="model-tag">' + IvuUI.escapeHtml(model) + '</span>';
    }).join('') || '<span class="empty-text">-</span>';

    var llmRows =
      reviewRow('服务名称', llm.service_name) +
      reviewRow('分组', llm.group) +
      reviewRow('模型服务商', llm.provider_type) +
      reviewRow('模型列表接口', llm.model_endpoint.schema + '://' + ipStr.replace(/\n/g, ',') + llm.model_endpoint.uri) +
      '<ul class="clearFloat detail-row detail-row-block"><li class="title">模型重定向:</li><li class="value">' +
        ((llm.model_mappings && llm.model_mappings.length)
          ? '<table class="mapping-table"><thead><tr><th>原请求的模型名称</th><th>转发的后端模型名称</th></tr></thead><tbody>' +
            llm.model_mappings.map(function (item) {
              return '<tr><td>' + IvuUI.escapeHtml(item.key) + '</td><td>' + IvuUI.escapeHtml(item.value) + '</td></tr>';
            }).join('') + '</tbody></table>'
          : '<span class="empty-text">-</span>') +
      '</li></ul>' +
      '<ul class="clearFloat detail-row"><li class="title">模型:</li><li class="value">' + modelsHtml + '</li></ul>' +
      reviewRow('服务鉴权Key', llm.keyInput ? '******' : '-');

    return '<div class="Review">' +
      renderReviewPanel('基本配置', basicRows) +
      renderReviewPanel('超时和重传', timeoutRows) +
      renderReviewPanel('被动健康检查', healthRows) +
      renderReviewPanel('实例配置', instanceRows) +
      renderReviewPanel('大模型配置', llmRows) +
    '</div>';
  }

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
        value = Array.from(field.selectedOptions).map(function (opt) { return opt.value; });
      } else if (field.tagName === 'SELECT') {
        value = field.value;
      } else if (field.type === 'number') {
        value = field.value === '' ? null : Number(field.value);
      } else {
        value = field.value;
      }
      if (path.indexOf('base.') === 0) setNestedValue(data.baseConfigData, path.slice(5), value);
      else if (path.indexOf('health.') === 0) data.passiveHealthData[path.slice(7)] = value;
      else if (path === 'instanceMode') data.instanceMode = value;
      else if (path === 'domainName') data.domainName = value;
      else if (path.indexOf('llm.') === 0) {
        var key = path.slice(4);
        if (key === 'model') {
          data.llmConfigData.models = value ? [value] : [];
        } else if (key.indexOf('model_endpoint.') === 0) {
          if (!data.llmConfigData.model_endpoint) data.llmConfigData.model_endpoint = {};
          data.llmConfigData.model_endpoint[key.slice(15)] = value;
        } else {
          data.llmConfigData[key] = value;
        }
      }
    });

    if (data.instanceMode !== 'domain') {
      var ipInputs = root.querySelectorAll('.proto-instance-ip');
      if (ipInputs.length) {
        data.instancePoolData = [];
        ipInputs.forEach(function (input) {
          var index = parseInt(input.getAttribute('data-index'), 10);
          var portInput = root.querySelector('.proto-instance-port[data-index="' + index + '"]');
          data.instancePoolData.push({
            ip: input.value.trim(),
            ports: { Default: portInput ? Number(portInput.value) : 80 },
            hostname: '',
            weight: 1,
            tags: { key: 'value' }
          });
        });
      }
    }

    data.headerList = [];
    root.querySelectorAll('.header-pair').forEach(function (pair, index) {
      var keyInput = pair.querySelector('.proto-header-key');
      var valueInput = pair.querySelector('.proto-header-value');
      data.headerList.push({
        key: keyInput ? keyInput.value : '',
        value: valueInput ? valueInput.value : ''
      });
    });

    data.llmConfigData.model_mappings = [];
    root.querySelectorAll('[data-mapping-index]').forEach(function (row) {
      var keyInput = row.querySelector('.proto-mapping-key');
      var valueSelect = row.querySelector('.proto-mapping-value');
      data.llmConfigData.model_mappings.push({
        key: keyInput ? keyInput.value : '',
        value: valueSelect ? valueSelect.value : ''
      });
    });
  }

  function renderActionButtons(currentStep, reviewStepIndex) {
    return (currentStep === reviewStepIndex
      ? IvuUI.btn('提交', 'primary', 'small', '', 'id="cluster-upsert-submit"')
      : IvuUI.btn('下一步', 'primary', 'small', '', 'id="cluster-upsert-next"')) +
      (currentStep !== 0 ? IvuUI.btn('上一步', 'default', 'small', '', 'id="cluster-upsert-prev"') : '');
  }

  function mount(bodyEl, footerEl, options) {
    options = options || {};
    var state = {
      currentStep: 0,
      isAdd: options.isAdd !== false,
      data: createDefaultData(options.row),
      reviewStepIndex: STEP_DEFS.length - 1
    };

    function renderStepContent() {
      switch (state.currentStep) {
        case 0: return renderBaseConfig(state.data, state.isAdd);
        case 1: return renderTimeout(state.data);
        case 2: return renderPassiveHealth(state.data);
        case 3: return renderInstancePool(state.data);
        case 4: return renderGatewayConfig(state.data);
        case 5: return renderReview(state.data);
        default: return '';
      }
    }

    function renderBody() {
      bodyEl.innerHTML =
        '<div class="newClusters">' +
          '<div id="cluster-step-content">' + renderStepContent() + '</div>' +
          '<footer class="cluster-steps-footer"><div class="ivu-steps ivu-steps-horizontal">' +
            IvuUI.clusterSteps(STEP_DEFS, state.currentStep) +
          '</div></footer>' +
        '</div>';
    }

    function renderFooter() {
      if (!footerEl) return;
      footerEl.innerHTML = '<div class="com-btn-box drawer-footer">' +
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
      if (nextBtn) nextBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        if (state.currentStep === 0 && !state.data.baseConfigData.name.trim()) {
          Prototype.toast('请输入集群名称', 'error');
          return;
        }
        state.currentStep += 1;
        render();
      });

      var prevBtn = scope.querySelector('#cluster-upsert-prev');
      if (prevBtn) prevBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        state.currentStep -= 1;
        render();
      });

      var submitBtn = scope.querySelector('#cluster-upsert-submit');
      if (submitBtn) submitBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        if (typeof options.onSubmit === 'function') options.onSubmit(state.data);
      });

      var modeSelect = bodyEl.querySelector('#cluster-instance-mode');
      if (modeSelect) modeSelect.addEventListener('change', function () {
        syncFromDom(bodyEl, state.data);
        render();
      });

      var addInstanceBtn = bodyEl.querySelector('#cluster-add-instance');
      if (addInstanceBtn) addInstanceBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        state.data.instancePoolData.push({ ip: '', ports: { Default: 80 }, hostname: '', weight: 1, tags: { key: 'value' } });
        render();
      });

      bodyEl.querySelectorAll('[data-action="remove-instance"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          var index = parseInt(btn.getAttribute('data-index'), 10);
          state.data.instancePoolData.splice(index, 1);
          render();
        });
      });

      var addHeaderBtn = bodyEl.querySelector('#cluster-add-header');
      if (addHeaderBtn) addHeaderBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        if (!state.data.headerList) state.data.headerList = [];
        state.data.headerList.push({ key: '', value: '' });
        render();
      });

      bodyEl.querySelectorAll('[data-action="remove-header"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.headerList.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
          render();
        });
      });

      var addMappingBtn = bodyEl.querySelector('#cluster-add-mapping');
      if (addMappingBtn) addMappingBtn.addEventListener('click', function () {
        syncFromDom(bodyEl, state.data);
        if (!state.data.llmConfigData.model_mappings) state.data.llmConfigData.model_mappings = [];
        state.data.llmConfigData.model_mappings.push({ key: '', value: '' });
        render();
      });

      bodyEl.querySelectorAll('[data-action="remove-mapping"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.llmConfigData.model_mappings.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
          render();
        });
      });

      var queryModelsBtn = bodyEl.querySelector('#cluster-query-models');
      if (queryModelsBtn) queryModelsBtn.addEventListener('click', function () {
        Prototype.toast('获取模型列表成功');
      });

      var hashStrategySelect = bodyEl.querySelector('[data-field="base.sticky_sessions.hash_strategy"]');
      if (hashStrategySelect) hashStrategySelect.addEventListener('change', function () {
        syncFromDom(bodyEl, state.data);
        render();
      });
    }

    render();

    return {
      getData: function () { return state.data; }
    };
  }

  return {
    createDefaultData: createDefaultData,
    renderReview: renderReview,
    mount: mount
  };
})();
