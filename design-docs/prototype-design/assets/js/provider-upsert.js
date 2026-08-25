window.ProviderUpsert = (function () {
  var PROTOCOL_OPTIONS = ['openai', 'anthropic'];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function validateProviderName(name) {
    if (!name) return false;
    if (name.length < 1 || name.length > 64) return false;
    return /^[A-Za-z0-9][A-Za-z0-9_.-]*[A-Za-z0-9]$|^[A-Za-z0-9]$/.test(name);
  }

  function maskSecretKey(key) {
    if (!key) return '';
    var s = String(key);
    if (s.length <= 8) return '****';
    return s.slice(0, 4) + '****' + s.slice(-4);
  }

  function createDefaultData(row) {
    row = row || {};
    return {
      name: row.name || '',
      description: row.description || '',
      model_endpoint: {
        schema: (row.model_endpoint && row.model_endpoint.schema) || 'https',
        uri: (row.model_endpoint && row.model_endpoint.uri) || '/v1/models',
      },
      models: (row.models || []).slice(),
      keys: row.keys && row.keys.length
        ? clone(row.keys)
        : [{ name: '', key: '' }],
      instance_pool: row.instance_pool && row.instance_pool.length
        ? clone(row.instance_pool)
        : [{ name: '', addr: '', weight: 100, port: 443 }],
      model_protocols: (row.model_protocols || ['openai']).slice(),
      create_time: row.create_time || 0,
      update_time: row.update_time || 0,
    };
  }

  function renderProtocolSelect(data, isView) {
    var selected = data.model_protocols || [];
    var tags = selected.length
      ? selected
          .map(function (item) {
            return (
              '<span class="ivu-tag ivu-tag-primary ivu-tag-checked' +
              (isView ? '' : ' ivu-tag-closable') +
              ' proto-protocol-tag">' +
              '<span class="ivu-tag-text">' +
              IvuUI.escapeHtml(item) +
              '</span>' +
              (isView
                ? ''
                : '<i class="ivu-icon ivu-icon-ios-close proto-protocol-remove" data-value="' +
                  IvuUI.escapeHtml(item) +
                  '"></i>') +
              '</span>'
            );
          })
          .join('')
      : '<span class="ivu-select-placeholder">请选择模型协议（可多选）</span>';

    var options = PROTOCOL_OPTIONS.map(function (item) {
      var on = selected.indexOf(item) !== -1;
      return (
        '<li class="ivu-select-item proto-protocol-option' +
        (on ? ' ivu-select-item-selected' : '') +
        '" data-value="' +
        item +
        '">' +
        item +
        '</li>'
      );
    }).join('');

    return (
      '<div class="ivu-select ivu-select-multiple proto-protocol-select' +
      (isView ? ' ivu-select-disabled' : '') +
      '">' +
      '<div class="ivu-select-selection proto-protocol-toggle">' +
      tags +
      '<i class="ivu-icon ivu-icon-ios-arrow-down ivu-select-arrow"></i>' +
      '</div>' +
      '<div class="ivu-select-dropdown proto-protocol-dropdown" style="display:none;">' +
      '<ul class="ivu-select-dropdown-list">' +
      options +
      '</ul></div></div>'
    );
  }

  function looksLikeIPv4(addr) {
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(addr || '');
  }

  function inferInstanceMode(pool) {
    if (!pool || pool.length !== 1) return 'ip';
    var inst = pool[0] || {};
    if (!(inst.addr || '').trim()) return 'ip';
    if (Number(inst.port) === 443 && Number(inst.weight) === 100 && !looksLikeIPv4(inst.addr)) {
      return 'domain';
    }
    return 'ip';
  }

  function firstInstanceHost(data) {
    var inst = ((data && data.instance_pool) || [])[0] || {};
    var addr = (inst.addr || '').trim();
    if (!addr) return '实例地址:端口';
    return addr + ':' + (inst.port != null && inst.port !== '' ? inst.port : 443);
  }

  function renderInstancePool(data, isView, instanceMode) {
    var disabled = isView ? ' disabled="disabled"' : '';
    var mode = instanceMode === 'domain' ? 'domain' : 'ip';
    var modeSelect =
      '<select id="provider-instance-mode" class="ivu-input proto-instance-mode" style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;"' +
      disabled +
      '>' +
      '<option value="ip"' +
      (mode === 'ip' ? ' selected' : '') +
      '>IP</option>' +
      '<option value="domain"' +
      (mode === 'domain' ? ' selected' : '') +
      '>服务商域名</option>' +
      '</select>';

    var bodyHtml = '';
    if (mode === 'domain') {
      var domain = ((data.instance_pool || [])[0] || {}).addr || '';
      bodyHtml = IvuUI.formTopItem(
        '服务商域名',
        '<input type="text" class="ivu-input proto-domain-addr" value="' +
          IvuUI.escapeHtml(domain) +
          '" placeholder="请输入服务商域名，例如 example.com"' +
          disabled +
          ' />',
      );
    } else {
      var canDelete = !isView && (data.instance_pool || []).length > 1;
      var instanceRows = (data.instance_pool || [])
        .map(function (item, index) {
          return (
            '<tr data-instance-index="' +
            index +
            '">' +
            '<td><input type="text" class="ivu-input proto-instance-addr" data-index="' +
            index +
            '" value="' +
            IvuUI.escapeHtml(item.addr || '') +
            '" placeholder="请输入 IP 或域名"' +
            disabled +
            ' /></td>' +
            '<td style="width:110px;"><input type="number" class="ivu-input proto-instance-port" data-index="' +
            index +
            '" min="1" max="65535" value="' +
            (item.port != null ? item.port : 443) +
            '"' +
            disabled +
            ' /></td>' +
            '<td style="width:110px;"><input type="number" class="ivu-input proto-instance-weight" data-index="' +
            index +
            '" min="0" max="100" value="' +
            (item.weight != null ? item.weight : 100) +
            '"' +
            disabled +
            ' /></td>' +
            '<td style="width:80px;">' +
            (isView
              ? '-'
              : '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small" data-action="remove-instance" data-index="' +
                index +
                '"' +
                (canDelete ? '' : ' disabled="disabled"') +
                '><span>删除</span></button>') +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
      bodyHtml =
        '<div class="ivu-form-item">' +
        '<label class="ivu-form-item-label" style="float:none;display:block;text-align:left;padding:0 0 8px;">实例IP列表</label>' +
        '<div class="ivu-form-item-content" style="margin-left:0!important;">' +
        '<table class="mapping-table">' +
        '<thead><tr>' +
        '<th>IP/域名</th><th style="width:110px;">端口</th><th style="width:110px;">权重</th><th style="width:80px;">操作</th>' +
        '</tr></thead><tbody id="provider-instance-body">' +
        instanceRows +
        '</tbody></table>' +
        (isView
          ? ''
          : '<button type="button" class="ivu-btn ivu-btn-primary ivu-btn-small" id="provider-add-instance" style="margin-top:12px;"><span>+ 创建</span></button>') +
        '</div></div>';
    }

    return (
      '<div class="llm-card"><div class="llm-card-title">实例池</div><div class="llm-card-body">' +
      IvuUI.formTop(IvuUI.formTopItem('实例形态', modeSelect, true) + bodyHtml) +
      '</div></div>'
    );
  }

  function renderEndpointUrlGroup(data, isView) {
    var disabled = isView ? ' disabled="disabled"' : '';
    var schema = (data.model_endpoint && data.model_endpoint.schema) || 'https';
    var uri = (data.model_endpoint && data.model_endpoint.uri) || '/v1/models';
    return (
      '<div class="endpoint-url-group">' +
      '<select class="endpoint-protocol proto-field" data-field="model_endpoint.schema"' +
      disabled +
      '>' +
      '<option value="https"' +
      (schema === 'https' ? ' selected' : '') +
      '>https://</option>' +
      '<option value="http"' +
      (schema === 'http' ? ' selected' : '') +
      '>http://</option>' +
      '</select>' +
      '<span class="endpoint-host">' +
      IvuUI.escapeHtml(firstInstanceHost(data)) +
      '</span>' +
      '<input type="text" class="ivu-input endpoint-uri proto-field" data-field="model_endpoint.uri" value="' +
      IvuUI.escapeHtml(uri) +
      '" placeholder="/v1/models"' +
      disabled +
      ' />' +
      '</div>'
    );
  }

  function formatTime(ts) {
    if (!ts) return '-';
    try {
      var date = new Date(Number(ts) * 1000);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('zh-CN');
    } catch (e) {
      return '-';
    }
  }

  function renderTags(list) {
    if (!list || !list.length) return '-';
    return list
      .map(function (item) {
        return IvuUI.tag(IvuUI.escapeHtml(item), 'primary');
      })
      .join(' ');
  }

  function renderDetailTable(headers, rowsHtml) {
    if (!rowsHtml) return '-';
    return (
      '<table class="mapping-table">' +
      '<thead><tr>' +
      headers
        .map(function (h) {
          return '<th' + (h.width ? ' style="width:' + h.width + ';"' : '') + '>' + h.title + '</th>';
        })
        .join('') +
      '</tr></thead><tbody>' +
      rowsHtml +
      '</tbody></table>'
    );
  }

  function renderDetail(data) {
    data = data || createDefaultData({});
    var mode = inferInstanceMode(data.instance_pool || []);
    var endpoint = data.model_endpoint || {};
    var endpointUrl =
      (endpoint.schema || 'https') +
      '://' +
      firstInstanceHost(data) +
      (endpoint.uri || '');

    var instanceBody = '';
    if (mode === 'domain') {
      var domain = ((data.instance_pool || [])[0] || {}).addr || '';
      instanceBody =
        IvuUI.formTop(
          IvuUI.formTopItem('实例形态', '服务商域名') +
            IvuUI.formTopItem('服务商域名', IvuUI.escapeHtml(domain || '-')),
        );
    } else {
      var instanceRows = (data.instance_pool || [])
        .map(function (item) {
          return (
            '<tr><td>' +
            IvuUI.escapeHtml(item.addr || '-') +
            '</td><td>' +
            IvuUI.escapeHtml(item.port != null ? item.port : '-') +
            '</td><td>' +
            IvuUI.escapeHtml(item.weight != null ? item.weight : '-') +
            '</td></tr>'
          );
        })
        .join('');
      instanceBody =
        IvuUI.formTop(IvuUI.formTopItem('实例形态', 'IP')) +
        renderDetailTable(
          [
            { title: 'IP/域名' },
            { title: '端口', width: '110px' },
            { title: '权重', width: '110px' },
          ],
          instanceRows,
        );
    }

    var keyRows = (data.keys || [])
      .filter(function (item) {
        return (item.name && item.name.trim()) || (item.key && item.key.trim());
      })
      .map(function (item) {
        return (
          '<tr><td>' +
          IvuUI.escapeHtml(item.name || '-') +
          '</td><td>' +
          IvuUI.escapeHtml(maskSecretKey(item.key || '') || '-') +
          '</td></tr>'
        );
      })
      .join('');

    return (
      '<div class="gateway-config provider-detail">' +
      IvuUI.card(
        '基本信息',
        IvuUI.formTop(
          IvuUI.formTopItem('名称', IvuUI.escapeHtml(data.name || '-')) +
            IvuUI.formTopItem('描述', IvuUI.escapeHtml(data.description || '-')),
        ),
      ) +
      IvuUI.card('实例池', instanceBody) +
      IvuUI.card(
        '模型服务配置',
        IvuUI.formTop(
          IvuUI.formTopItem('模型协议', renderTags(data.model_protocols)) +
            IvuUI.formTopItem('模型列表接口', IvuUI.escapeHtml(endpointUrl)) +
            IvuUI.formTopItem('模型列表', renderTags(data.models)),
        ),
      ) +
      IvuUI.card(
        '服务鉴权 Keys',
        renderDetailTable(
          [
            { title: 'Key 名称' },
            { title: 'Key 值' },
          ],
          keyRows,
        ),
      ) +
      IvuUI.card(
        '时间戳',
        '<div class="info-row"><div class="info-label">创建时间</div><div class="info-value">' +
          formatTime(data.create_time) +
          '</div></div>' +
          '<div class="info-row"><div class="info-label">更新时间</div><div class="info-value">' +
          formatTime(data.update_time || data.create_time) +
          '</div></div>',
      ) +
      '</div>'
    );
  }

  function renderForm(data, isAdd, isView, instanceMode) {
    var disabled = isView ? ' disabled="disabled"' : '';
    var nameDisabled = !isAdd || isView ? ' disabled="disabled"' : '';

    var protocolSelect = renderProtocolSelect(data, isView);

    var keyRows = (data.keys || [])
      .map(function (item, index) {
        var keyDisplay = isView ? maskSecretKey(item.key || '') : item.key || '';
        return (
          '<tr data-key-index="' +
          index +
          '">' +
          '<td><input type="text" class="ivu-input proto-key-name" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(item.name || '') +
          '" placeholder="Key 名称"' +
          disabled +
          ' /></td>' +
          '<td><input type="text" class="ivu-input proto-key-value" data-index="' +
          index +
          '" value="' +
          IvuUI.escapeHtml(keyDisplay) +
          '" placeholder="Key 值" autocomplete="new-password"' +
          disabled +
          ' /></td>' +
          '<td style="width:80px;">' +
          (isView
            ? '-'
            : '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small" data-action="remove-key" data-index="' +
              index +
              '"><span>删除</span></button>') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    var selectedModels = data.models || [];
    var modelTags = selectedModels.length
      ? selectedModels
          .map(function (m) {
            return (
              '<span class="ivu-tag ivu-tag-primary ivu-tag-checked proto-model-tag" data-model="' +
              IvuUI.escapeHtml(m) +
              '">' +
              '<span class="ivu-tag-text">' +
              IvuUI.escapeHtml(m) +
              '</span>' +
              (isView ? '' : '<i class="ivu-icon ivu-icon-ios-close"></i>') +
              '</span>'
            );
          })
          .join('')
      : '<span class="proto-placeholder">可手动维护，或点击「获取」回填</span>';

    return (
      '<div class="gateway-config">' +
      '<div class="llm-card"><div class="llm-card-title">基本信息</div><div class="llm-card-body">' +
      IvuUI.formTop(
        IvuUI.formTopItem(
          '名称',
          '<input type="text" class="ivu-input proto-field" data-field="name" value="' +
            IvuUI.escapeHtml(data.name) +
            '" placeholder="deepseek"' +
            nameDisabled +
            ' />',
          true,
        ) +
          IvuUI.formTopItem(
            '描述',
            '<input type="text" class="ivu-input proto-field" data-field="description" value="' +
              IvuUI.escapeHtml(data.description) +
              '" placeholder="最多 256 个字符"' +
              disabled +
              ' />',
          ),
      ) +
      '</div></div>' +
      renderInstancePool(data, isView, instanceMode) +
      '<div class="llm-card"><div class="llm-card-title">模型服务配置</div><div class="llm-card-body">' +
      IvuUI.formTop(
        IvuUI.formTopItem(
          '模型协议',
          protocolSelect,
          true,
        ) +
          IvuUI.formTopItem(
            '模型列表接口',
            renderEndpointUrlGroup(data, isView),
          ),
      ) +
      '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #e8eaec;">' +
      '<div class="ivu-form-item-label" style="float:none;display:block;text-align:left;padding:0 0 8px;">模型列表</div>' +
      '<div class="proto-model-select-wrap" style="display:flex;align-items:flex-start;gap:10px;">' +
      '<div class="proto-model-select" id="proto-provider-models" style="flex:1;min-height:32px;">' +
      '<div class="proto-model-select-tags">' +
      modelTags +
      '</div></div>' +
      (isView
        ? ''
        : '<button type="button" class="ivu-btn ivu-btn-primary" id="provider-discover-models"><span>获取</span></button>') +
      '</div>' +
      (isView
        ? ''
        : '<div style="margin-top:10px;display:flex;gap:8px;">' +
          '<input type="text" class="ivu-input" id="provider-model-input" placeholder="手动添加模型名" style="flex:1;" />' +
          IvuUI.btn('添加', 'default', 'small', '', 'id="provider-add-model"') +
          '</div>') +
      '</div>' +
      '</div></div>' +
      '<div class="llm-card"><div class="llm-card-title">服务鉴权 Keys</div><div class="llm-card-body">' +
      '<table class="mapping-table">' +
      '<thead><tr>' +
      '<th>Key 名称</th><th>Key 值</th><th style="width:80px;">操作</th>' +
      '</tr></thead><tbody id="provider-keys-body">' +
      keyRows +
      '</tbody></table>' +
      (isView
        ? ''
        : '<button type="button" class="ivu-btn ivu-btn-primary ivu-btn-small" id="provider-add-key" style="margin-top:20px;"><span>+ 添加 Key</span></button>') +
      '</div></div>' +
      '</div>'
    );
  }

  function syncFromDom(root, data) {
    root.querySelectorAll('.proto-field').forEach(function (field) {
      var path = field.getAttribute('data-field');
      if (!path) return;
      if (path === 'name') data.name = field.value;
      else if (path === 'description') data.description = field.value;
      else if (path === 'model_endpoint.schema') data.model_endpoint.schema = field.value;
      else if (path === 'model_endpoint.uri') data.model_endpoint.uri = field.value;
    });

    data.model_protocols = [];
    root.querySelectorAll('.proto-protocol-option.ivu-select-item-selected').forEach(function (item) {
      data.model_protocols.push(item.getAttribute('data-value'));
    });

    data.instance_pool = [];
    var domainInput = root.querySelector('.proto-domain-addr');
    if (domainInput) {
      data.instance_pool.push({
        name: '',
        addr: domainInput.value || '',
        port: 443,
        weight: 100,
      });
    } else {
      root.querySelectorAll('[data-instance-index]').forEach(function (row) {
        data.instance_pool.push({
          name: '',
          addr: (row.querySelector('.proto-instance-addr') || {}).value || '',
          port: Number((row.querySelector('.proto-instance-port') || {}).value || 443),
          weight: Number((row.querySelector('.proto-instance-weight') || {}).value || 0),
        });
      });
    }

    data.keys = [];
    root.querySelectorAll('[data-key-index]').forEach(function (row) {
      data.keys.push({
        name: (row.querySelector('.proto-key-name') || {}).value || '',
        key: (row.querySelector('.proto-key-value') || {}).value || '',
      });
    });
  }

  function validate(data, isAdd, existingNames, instanceMode) {
    var name = (data.name || '').trim();
    if (!name) return '请输入 Provider 名称';
    if (!validateProviderName(name)) {
      return 'Provider 名称格式不正确：1-64 字符，字母或数字开头结尾，允许字母、数字、_、-、.';
    }
    if (isAdd && (existingNames || []).indexOf(name) !== -1) {
      return 'Provider 名称已存在';
    }
    if (data.description && data.description.length > 256) {
      return '描述不能超过 256 个字符';
    }
    if (data.description && /[\x00-\x1F\x7F]/.test(data.description)) {
      return '描述不能包含控制字符';
    }
    if (!data.model_protocols || !data.model_protocols.length) {
      return '请至少选择一个模型协议';
    }
    var protocolSet = {};
    for (var p = 0; p < data.model_protocols.length; p++) {
      var proto = data.model_protocols[p];
      if (PROTOCOL_OPTIONS.indexOf(proto) === -1) {
        return '模型协议取值须为 openai 或 anthropic';
      }
      if (protocolSet[proto]) return '模型协议不能重复';
      protocolSet[proto] = true;
    }
    var uri = (data.model_endpoint && data.model_endpoint.uri) || '';
    if (uri && uri.charAt(0) !== '/') return '模型接口 URI 必须以 / 开头';

    var instances = data.instance_pool || [];
    if (!instances.length) return '实例池至少需要 1 个实例';
    var addrSet = {};
    var hasWeight = false;
    for (var i = 0; i < instances.length; i++) {
      var inst = instances[i];
      var addr = (inst.addr || '').trim();
      if (!addr) {
        return instanceMode === 'domain'
          ? '请填写服务商域名'
          : '第 ' + (i + 1) + ' 个实例请填写 IP 或域名';
      }
      var port = Number(inst.port);
      if (!Number.isFinite(port) || port < 1 || port > 65535) {
        return '第 ' + (i + 1) + ' 个实例端口须为 1–65535';
      }
      var weight = Number(inst.weight);
      if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
        return '第 ' + (i + 1) + ' 个实例权重须为 0–100';
      }
      if (weight > 0) hasWeight = true;
      // 表单不填 name，提交后默认与 addr 相同，因此 (name, addr) 唯一性等价于 addr 唯一
      if (addrSet[addr]) return '实例地址不能重复：' + addr;
      addrSet[addr] = true;
    }
    if (!hasWeight) return '至少有一个实例权重大于 0';

    var keys = (data.keys || []).filter(function (k) {
      return (k.name && k.name.trim()) || (k.key && k.key.trim());
    });
    var keyNames = {};
    for (var j = 0; j < keys.length; j++) {
      var kn = (keys[j].name || '').trim();
      var kv = (keys[j].key || '').trim();
      if (!kn) return 'Key 名称必填';
      if (kn.length > 128) return 'Key 名称长度须为 1–128 字符';
      if (!kv) return 'Key 值必填';
      if (kv.length > 512) return 'Key 值长度须为 1–512 字符';
      if (keyNames[kn]) return 'Key 名称不能重复：' + kn;
      keyNames[kn] = true;
    }
    data.keys = keys;
    return null;
  }

  function mount(bodyEl, footerEl, options) {
    options = options || {};
    var state = {
      isAdd: options.isAdd !== false,
      isView: !!options.isView,
      data: createDefaultData(options.row),
      existingNames: options.existingNames || [],
      instanceMode: inferInstanceMode((options.row && options.row.instance_pool) || []),
    };

    function render() {
      bodyEl.innerHTML = state.isView
        ? renderDetail(state.data)
        : renderForm(state.data, state.isAdd, state.isView, state.instanceMode);
      if (footerEl) {
        footerEl.innerHTML = state.isView
          ? IvuUI.btn('关闭', 'default', 'small', '', 'id="provider-upsert-cancel"')
          : IvuUI.btn('提交', 'primary', 'small', '', 'id="provider-upsert-submit"') +
            ' ' +
            IvuUI.btn('取消', 'default', 'small', '', 'id="provider-upsert-cancel"');
      }
      bindEvents();
    }

    function refreshProtocolSelect(keepOpen) {
      var wrap = bodyEl.querySelector('.proto-protocol-select');
      if (!wrap) return;
      wrap.outerHTML = renderProtocolSelect(state.data, state.isView);
      bindProtocolSelect(keepOpen);
    }

    function toggleProtocol(value, keepOpen) {
      var list = state.data.model_protocols || [];
      var idx = list.indexOf(value);
      if (idx === -1) list.push(value);
      else list.splice(idx, 1);
      state.data.model_protocols = list;
      refreshProtocolSelect(!!keepOpen);
    }

    function bindProtocolSelect(keepOpen) {
      if (state.isView) return;
      var wrap = bodyEl.querySelector('.proto-protocol-select');
      if (!wrap) return;
      var dropdown = wrap.querySelector('.proto-protocol-dropdown');
      var toggle = wrap.querySelector('.proto-protocol-toggle');
      if (keepOpen && dropdown) dropdown.style.display = 'block';

      if (toggle) {
        toggle.addEventListener('click', function (e) {
          e.stopPropagation();
          if (e.target.closest('.proto-protocol-remove')) return;
          if (!dropdown) return;
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
      }

      wrap.querySelectorAll('.proto-protocol-option').forEach(function (item) {
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleProtocol(item.getAttribute('data-value'), true);
        });
      });

      wrap.querySelectorAll('.proto-protocol-remove').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleProtocol(icon.getAttribute('data-value'), false);
        });
      });
    }

    function bindEvents() {
      var cancelBtn = footerEl && footerEl.querySelector('#provider-upsert-cancel');
      if (cancelBtn && typeof options.onCancel === 'function') {
        cancelBtn.addEventListener('click', options.onCancel);
      }
      if (state.isView) return;

      bindProtocolSelect(false);
      var modeSelect = bodyEl.querySelector('#provider-instance-mode');
      if (modeSelect && !state.isView) {
        modeSelect.addEventListener('change', function () {
          syncFromDom(bodyEl, state.data);
          var nextMode = modeSelect.value === 'domain' ? 'domain' : 'ip';
          var first = (state.data.instance_pool || [])[0] || { addr: '', port: 443, weight: 100 };
          if (nextMode === 'domain') {
            state.data.instance_pool = [
              { name: '', addr: first.addr || '', port: 443, weight: 100 },
            ];
          } else if (!state.data.instance_pool.length) {
            state.data.instance_pool = [{ name: '', addr: first.addr || '', port: 443, weight: 100 }];
          }
          state.instanceMode = nextMode;
          render();
        });
      }
      var addInst = bodyEl.querySelector('#provider-add-instance');
      if (addInst) {
        addInst.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.instance_pool.push({ name: '', addr: '', weight: 0, port: 443 });
          render();
        });
      }
      bodyEl.querySelectorAll('[data-action="remove-instance"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (state.data.instance_pool.length <= 1) {
            Prototype.toast('至少保留一个实例', 'error');
            return;
          }
          state.data.instance_pool.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
          render();
        });
      });
      function refreshEndpointHost() {
        syncFromDom(bodyEl, state.data);
        var hostEl = bodyEl.querySelector('.endpoint-host');
        if (hostEl) hostEl.textContent = firstInstanceHost(state.data);
      }
      bodyEl.querySelectorAll('.proto-instance-addr, .proto-instance-port, .proto-domain-addr').forEach(function (input) {
        input.addEventListener('input', refreshEndpointHost);
      });

      var addKey = bodyEl.querySelector('#provider-add-key');
      if (addKey) {
        addKey.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.keys.push({ name: '', key: '' });
          render();
        });
      }
      bodyEl.querySelectorAll('[data-action="remove-key"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.keys.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
          render();
        });
      });
      var addModel = bodyEl.querySelector('#provider-add-model');
      if (addModel) {
        addModel.addEventListener('click', function () {
          var input = bodyEl.querySelector('#provider-model-input');
          var value = input && input.value ? input.value.trim() : '';
          if (!value) return;
          syncFromDom(bodyEl, state.data);
          if (state.data.models.indexOf(value) === -1) state.data.models.push(value);
          render();
        });
      }
      bodyEl.querySelectorAll('.proto-model-tag .ivu-icon-ios-close').forEach(function (icon) {
        icon.addEventListener('click', function () {
          var tag = icon.parentNode;
          var model = tag.getAttribute('data-model');
          syncFromDom(bodyEl, state.data);
          state.data.models = (state.data.models || []).filter(function (item) {
            return item !== model;
          });
          render();
        });
      });

      var discoverBtn = bodyEl.querySelector('#provider-discover-models');
      if (discoverBtn) {
        discoverBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          var keys = (state.data.keys || []).filter(function (k) {
            return k.name && k.key;
          });
          if (!keys.length) {
            Prototype.toast('keys 为空时无法构造认证请求（422）', 'error');
            return;
          }
          if (!state.data.models.length) {
            state.data.models = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
          }
          Prototype.toast('已回填模型列表');
          render();
        });
      }

      var submitBtn = footerEl && footerEl.querySelector('#provider-upsert-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          var err = validate(state.data, state.isAdd, state.existingNames, state.instanceMode);
          if (err) {
            Prototype.toast(err, 'error');
            return;
          }
          if (typeof options.onSubmit === 'function') options.onSubmit(state.data);
        });
      }
    }

    if (bodyEl._protocolOutsideClose) {
      document.removeEventListener('click', bodyEl._protocolOutsideClose);
    }
    bodyEl._protocolOutsideClose = function (e) {
      var wrap = bodyEl.querySelector('.proto-protocol-select');
      if (!wrap || wrap.contains(e.target)) return;
      var dropdown = wrap.querySelector('.proto-protocol-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    };
    document.addEventListener('click', bodyEl._protocolOutsideClose);

    render();
    return {
      getData: function () {
        return state.data;
      },
    };
  }

  return {
    createDefaultData: createDefaultData,
    renderForm: renderForm,
    renderDetail: renderDetail,
    mount: mount,
  };
})();
