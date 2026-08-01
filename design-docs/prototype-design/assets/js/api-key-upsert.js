window.ApiKeyUpsert = {
  maskKey(key) {
    if (!key) return '-';
    if (key.length <= 12) return key;
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  },

  formatNumber(num) {
    num = Number(num) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  },

  formatQuota(row) {
    if (row.unlimited_quota || (row.quota_plan && row.quota_plan.unlimited)) return '-';
    var plan = row.quota_plan || {};
    var used = (plan.balance && plan.balance.used) || 0;
    var quota = plan.quota || 0;
    return ApiKeyUpsert.formatNumber(used) + ' / ' + ApiKeyUpsert.formatNumber(quota);
  },

  rowSpan2(content) {
    return '<div class="api-key-form-grid">' + content + '</div>';
  },

  col(content) {
    return '<div class="api-key-form-col">' + content + '</div>';
  },

  renderUpsertBody(data, isAdd) {
    data = data || {};
    var plan = data.quota_plan || { unlimited: 'true', quota: 0, unit: 'total_token', reset_period: 'never', pass_when_no_enough_quota: 'false' };
    var policy = data.rate_limit_policy || { enabled: 'false', rules: { max_concurrency: -1, tpm: [], rpm: [] } };
    var enabled = data.enabled !== false && data.enabled !== 'false';
    var unlimitedQuota = data.unlimited_quota === true || data.unlimited_quota === 'true';
    var rateEnabled = policy.enabled === true || policy.enabled === 'true';
    var planLimited = plan.unlimited === false || plan.unlimited === 'false';
    var maxConc = policy.rules && policy.rules.max_concurrency;
    var maxMode = maxConc === 0 ? 'banned' : (maxConc > 0 ? 'limited' : 'unlimited');
    var entities = (MockData.entities || []).map(function (e) { return e.name + ' (' + e.type + ')'; });
    var tpmRules = (policy.rules && policy.rules.tpm) || [];
    var rpmRules = (policy.rules && policy.rules.rpm) || [];
    var models = data.models && data.models.length ? data.models.slice() : ['*'];

    return '<form class="ivu-form ivu-form-label-top api-key-upsert-form">' +
      IvuUI.card('基本信息',
        IvuUI.formTopItem('描述',
          '<div class="ivu-input-wrapper ivu-input-type-text">' +
            '<input type="text" id="api-desc" class="ivu-input" value="' + IvuUI.escapeHtml(data.description || '') + '" placeholder="请输入API-Key描述" />' +
          '</div>', true) +
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(
            IvuUI.formTopItem('过期时间',
              '<label class="api-key-checkbox-line">' +
                '<input type="checkbox" id="api-never-expire" checked /> 永不过期' +
              '</label>')
          ) +
          ApiKeyUpsert.col('')
        ) +
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(IvuUI.formTopItem('启用状态', ApiKeyUpsert.nativeSelect('api-enabled', ['true', 'false'], enabled ? 'true' : 'false', ['启用', '停用']))) +
          ApiKeyUpsert.col(IvuUI.formTopItem('执行配额检查', ApiKeyUpsert.nativeSelect('api-quota-check', ['false', 'true'], unlimitedQuota ? 'true' : 'false', ['是', '否'])))
        ) +
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(IvuUI.formTopItem('允许模型', ApiKeyUpsert.renderModelsMultiSelect(models))) +
          ApiKeyUpsert.col(IvuUI.formTopItem('允许子网',
            '<div class="ivu-input-wrapper ivu-input-type-textarea">' +
              '<textarea id="api-subnet" class="ivu-input" rows="3" placeholder="默认&quot;*&quot;表示不限制">' +
                IvuUI.escapeHtml(data.subnet || '*') +
              '</textarea></div>' +
            '<p class="form-tip">多个网段用换行分隔，默认为*表示不限制</p>'))
        ) +
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(IvuUI.formTopItem('挂载Entity',
            ApiKeyUpsert.nativeSelect('api-entity', entities, entities[0] || '', entities)))
        )
      ) +
      IvuUI.card('配额信息',
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(IvuUI.formTopItem('无限配额',
            ApiKeyUpsert.nativeSelect('api-plan-unlimited', ['true', 'false'], planLimited ? 'false' : 'true', ['是', '否'])))
        ) +
        ApiKeyUpsert.renderQuotaDetails(plan, planLimited)
      ) +
      IvuUI.card('限流配置',
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(IvuUI.formTopItem('启用限流',
            ApiKeyUpsert.nativeSelect('api-rate-enabled', ['true', 'false'], rateEnabled ? 'true' : 'false', ['是', '否'])))
        ) +
        '<div id="api-rate-details"' + (rateEnabled ? '' : ' class="proto-hidden-inline"') + '>' +
          ApiKeyUpsert.renderRateLimitRules(tpmRules, rpmRules, maxMode, maxConc) +
        '</div>'
      ) +
      '</form>';
  },

  renderQuotaDetails(plan, visible) {
    plan = plan || {};
    return '<div id="api-quota-details"' + (visible ? '' : ' class="proto-hidden-inline"') + '>' +
      ApiKeyUpsert.rowSpan2(
        ApiKeyUpsert.col(IvuUI.formTopItem('配额不足时放行',
          ApiKeyUpsert.nativeSelect('api-pass-no-quota', ['true', 'false'], 'false', ['是', '否']))) +
        ApiKeyUpsert.col(IvuUI.formTopItem('配额总量',
          IvuUI.inputNumber(plan.quota || 1000000, 'id="api-quota-total" style="width:100%"')))
      ) +
      ApiKeyUpsert.rowSpan2(
        ApiKeyUpsert.col(IvuUI.formTopItem('配额单位',
          ApiKeyUpsert.nativeSelect('api-quota-unit', ['total_token'], 'total_token', ['total_token']))) +
        ApiKeyUpsert.col(IvuUI.formTopItem('重置周期',
          ApiKeyUpsert.nativeSelect('api-reset-period', ['never', 'weekly', 'monthly'], plan.reset_period || 'monthly', ['永不重置', '每周', '每月'])))
      ) +
    '</div>';
  },

  formatModelsText(models) {
    models = models || [];
    if (!models.length || models.indexOf('*') >= 0) return '全部模型';
    return models.join(', ');
  },

  renderModelsMultiSelect(models, options) {
    options = options || {};
    var rootId = options.rootId || 'api-models-select';
    var includeAll = options.includeAll !== false;
    var placeholder = options.placeholder || '请选择模型';
    models = models && models.length ? models.slice() : (includeAll ? ['*'] : []);
    if (includeAll && models.indexOf('*') >= 0) models = ['*'];
    var groups = MockData.modelGroups || [];
    var optionsHtml = includeAll
      ? '<div class="proto-el-multiselect-option" data-value="*">全部模型</div>'
      : '';
    groups.forEach(function (group) {
      optionsHtml += '<div class="proto-el-multiselect-group">' + IvuUI.escapeHtml(group.label) + '</div>';
      (group.models || []).forEach(function (model) {
        optionsHtml += '<div class="proto-el-multiselect-option" data-value="' + IvuUI.escapeHtml(model) + '">' +
          IvuUI.escapeHtml(model) + '</div>';
      });
    });
    return '<div class="proto-el-multiselect" id="' + rootId + '" data-selected="' +
      IvuUI.escapeHtml(JSON.stringify(models)) + '" data-include-all="' + (includeAll ? 'true' : 'false') + '">' +
      '<div class="proto-el-multiselect-trigger">' +
        '<div class="proto-el-multiselect-tags"></div>' +
        '<span class="proto-el-multiselect-placeholder">' + IvuUI.escapeHtml(placeholder) + '</span>' +
        '<span class="proto-el-multiselect-arrow">▾</span>' +
      '</div>' +
      '<div class="proto-el-multiselect-dropdown proto-hidden">' + optionsHtml + '</div>' +
    '</div>';
  },

  initModelsMultiSelect(rootId) {
    var root = document.getElementById(rootId || 'api-models-select');
    if (!root) return;

    var includeAll = root.getAttribute('data-include-all') !== 'false';
    var selected = [];
    try {
      selected = JSON.parse(root.getAttribute('data-selected') || (includeAll ? '["*"]' : '[]'));
    } catch (err) {
      selected = includeAll ? ['*'] : [];
    }
    if (includeAll) {
      if (!selected.length) selected = ['*'];
      if (selected.indexOf('*') >= 0) selected = ['*'];
    }

    var dropdown = root.querySelector('.proto-el-multiselect-dropdown');
    var tagsEl = root.querySelector('.proto-el-multiselect-tags');
    var placeholder = root.querySelector('.proto-el-multiselect-placeholder');
    var trigger = root.querySelector('.proto-el-multiselect-trigger');

    function getLabel(value) {
      return value === '*' ? '全部模型' : value;
    }

    function persist() {
      root.setAttribute('data-selected', JSON.stringify(selected));
    }

    function renderTags() {
      tagsEl.innerHTML = selected.map(function (val) {
        return '<span class="proto-el-tag" data-value="' + IvuUI.escapeHtml(val) + '">' +
          IvuUI.escapeHtml(getLabel(val)) +
          '<span class="proto-el-tag-close" data-remove="' + IvuUI.escapeHtml(val) + '">×</span></span>';
      }).join('');
      placeholder.style.display = selected.length ? 'none' : 'inline';
      root.querySelectorAll('.proto-el-multiselect-option').forEach(function (opt) {
        opt.classList.toggle('is-selected', selected.indexOf(opt.getAttribute('data-value')) !== -1);
      });
      persist();
    }

    function closeDropdown() {
      dropdown.classList.add('proto-hidden');
      root.classList.remove('is-open');
    }

    function openDropdown() {
      dropdown.classList.remove('proto-hidden');
      root.classList.add('is-open');
    }

    function toggleModel(value) {
      var idx = selected.indexOf(value);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else if (includeAll && value === '*') {
        selected = ['*'];
      } else if (includeAll) {
        selected = selected.filter(function (v) { return v !== '*'; });
        selected.push(value);
      } else {
        selected.push(value);
      }
      if (includeAll && !selected.length) selected = ['*'];
      renderTags();
    }

    trigger.onclick = function (e) {
      if (e.target.closest('.proto-el-tag-close')) return;
      e.stopPropagation();
      if (dropdown.classList.contains('proto-hidden')) openDropdown();
      else closeDropdown();
    };

    root.querySelectorAll('.proto-el-multiselect-option').forEach(function (opt) {
      opt.onclick = function (e) {
        e.stopPropagation();
        toggleModel(opt.getAttribute('data-value'));
        if (includeAll && opt.getAttribute('data-value') === '*') closeDropdown();
      };
    });

    tagsEl.onclick = function (e) {
      var closeBtn = e.target.closest('.proto-el-tag-close');
      if (!closeBtn) return;
      e.stopPropagation();
      var val = closeBtn.getAttribute('data-remove');
      selected = selected.filter(function (v) { return v !== val; });
      if (includeAll && !selected.length) selected = ['*'];
      renderTags();
    };

    if (!window._protoModelsOutsideClickBound) {
      window._protoModelsOutsideClickBound = true;
      document.addEventListener('mousedown', function (e) {
        document.querySelectorAll('.proto-el-multiselect.is-open').forEach(function (el) {
          if (el.contains(e.target)) return;
          var panel = el.querySelector('.proto-el-multiselect-dropdown');
          if (panel) panel.classList.add('proto-hidden');
          el.classList.remove('is-open');
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.proto-el-multiselect.is-open').forEach(function (el) {
          var panel = el.querySelector('.proto-el-multiselect-dropdown');
          if (panel) panel.classList.add('proto-hidden');
          el.classList.remove('is-open');
        });
      });
    }

    closeDropdown();
    renderTags();
  },

  initUpsertForm() {
    function toggle(el, show) {
      if (!el) return;
      el.classList.toggle('proto-hidden-inline', !show);
    }

    var planSelect = document.getElementById('api-plan-unlimited');
    if (planSelect) {
      var syncQuota = function () {
        toggle(document.getElementById('api-quota-details'), planSelect.value === 'false');
      };
      planSelect.onchange = syncQuota;
      syncQuota();
    }

    var rateSelect = document.getElementById('api-rate-enabled');
    if (rateSelect) {
      var syncRate = function () {
        toggle(document.getElementById('api-rate-details'), rateSelect.value === 'true');
      };
      rateSelect.onchange = syncRate;
      syncRate();
    }

    var maxModeSelect = document.getElementById('api-max-concurrency-mode');
    if (maxModeSelect) {
      var syncMaxConc = function () {
        toggle(document.getElementById('api-max-concurrency-input'), maxModeSelect.value === 'limited');
      };
      maxModeSelect.onchange = syncMaxConc;
      syncMaxConc();
    }

    ApiKeyUpsert.initModelsMultiSelect();
  },

  ruleRow(type, rule) {
    var isTpm = type === 'tpm';
    var modelSelect = ApiKeyUpsert.nativeSelect('', ['*', 'gpt-4o'], rule.model || '*', ['全部模型', 'gpt-4o']);
    var fields =
      ApiKeyUpsert.ruleField(IvuUI.formTopItem('规则名称', IvuUI.input(rule.name || '', ''))) +
      ApiKeyUpsert.ruleField(IvuUI.formTopItem('适用模型', modelSelect)) +
      ApiKeyUpsert.ruleField(IvuUI.formTopItem('时间窗口(分)', IvuUI.inputNumber(rule.window_minutes || 1, 'style="width:100%"'))) +
      ApiKeyUpsert.ruleField(IvuUI.formTopItem(
        isTpm ? '最大Token数' : '最大请求数',
        IvuUI.inputNumber(isTpm ? (rule.max_tokens || 100000) : (rule.max_requests || 1000), 'style="width:100%"')
      ));
    if (isTpm) {
      fields += ApiKeyUpsert.ruleField(IvuUI.formTopItem('滑动步长(分)', IvuUI.inputNumber(rule.step_minutes || 1, 'style="width:100%"')));
    }
    fields += ApiKeyUpsert.ruleField(
      IvuUI.formTopItem('操作', IvuUI.btn('删除', 'error', 'small', '', 'type="button"')),
      'rule-op'
    );
    return '<div class="rule-row"><div class="api-key-rule-grid">' + fields + '</div></div>';
  },

  ruleField(content, extraClass) {
    return '<div class="api-key-rule-field' + (extraClass ? ' ' + extraClass : '') + '">' + content + '</div>';
  },

  renderRateLimitRules(tpmRules, rpmRules, maxMode, maxConc) {
    var tpm = tpmRules[0] || { name: 'tpm-gpt4', model: '*', window_minutes: 1, max_tokens: 100000, step_minutes: 1 };
    var rpm = rpmRules[0] || { name: 'rpm-default', model: '*', window_minutes: 1, max_requests: 1000 };
    return '<div class="rules-section">' +
        '<h4 class="rules-title">TPM规则</h4>' +
        ApiKeyUpsert.ruleRow('tpm', tpm) +
        '<div class="rules-section-actions">' + IvuUI.btn('添加规则', 'primary', 'small', '', 'type="button"') + '</div>' +
      '</div>' +
      '<div class="rules-section">' +
        '<h4 class="rules-title">RPM规则</h4>' +
        ApiKeyUpsert.ruleRow('rpm', rpm) +
        '<div class="rules-section-actions">' + IvuUI.btn('添加规则', 'primary', 'small', '', 'type="button"') + '</div>' +
      '</div>' +
      '<div class="max-concurrency-section">' +
        ApiKeyUpsert.rowSpan2(
          ApiKeyUpsert.col(
            IvuUI.formTopItem('最大并发',
              ApiKeyUpsert.nativeSelect('api-max-concurrency-mode', ['unlimited', 'banned', 'limited'], maxMode, ['不限制', '封禁', '限制并发数']) +
              '<div id="api-max-concurrency-input" class="max-concurrency-custom-input' +
                (maxMode === 'limited' ? '' : ' proto-hidden-inline') + '">' +
                IvuUI.inputNumber(maxConc > 0 ? maxConc : 100, 'id="api-max-concurrency" style="width:100%"') +
              '</div>')
          )
        ) +
      '</div>';
  },

  nativeSelect(id, values, selected, labels, disabled) {
    labels = labels || values;
    var opts = values.map(function (val, i) {
      var sel = String(val) === String(selected) ? ' selected' : '';
      return '<option value="' + IvuUI.escapeHtml(val) + '"' + sel + '>' + IvuUI.escapeHtml(labels[i] || val) + '</option>';
    }).join('');
    var idAttr = id ? ' id="' + id + '"' : '';
    var disabledAttr = disabled ? ' disabled' : '';
    var disabledClass = disabled ? ' proto-field-disabled' : '';
    return '<div class="ivu-select ivu-select-single' + (disabled ? ' proto-select-disabled' : '') + '" style="width:100%;">' +
      '<div class="ivu-select-selection">' +
        '<select class="proto-ivu-select-native' + disabledClass + '"' + idAttr + disabledAttr +
          ' style="width:100%;height:32px;border:1px solid #dcdee2;border-radius:4px;padding:0 8px;">' +
          opts +
        '</select></div></div>';
  },

  renderViewBody(data) {
    data = data || {};
    var plan = data.quota_plan || {};
    var policy = data.rate_limit_policy || {};
    var used = (plan.balance && plan.balance.used) || 0;
    var quota = plan.quota || 0;
    var percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
    var planLimited = !data.unlimited_quota && plan.unlimited !== true && plan.unlimited !== 'true';
    var rateEnabled = policy.enabled === true || policy.enabled === 'true';
    var maxConc = policy.rules && policy.rules.max_concurrency;
    var tpmRules = (policy.rules && policy.rules.tpm) || [];
    var rpmRules = (policy.rules && policy.rules.rpm) || [];

    function infoRow(label, value) {
      return '<div class="info-row"><span class="info-label">' + label + '</span><span class="info-value">' + value + '</span></div>';
    }

    var quotaCard = IvuUI.card('配额信息',
      infoRow('配额类型', planLimited ? '有限配额' : '无限配额') +
      (planLimited
        ? infoRow('配额总量', ApiKeyUpsert.formatNumber(quota) + ' tokens') +
          infoRow('已使用', ApiKeyUpsert.formatNumber(used) + ' tokens (' + percent + '%)') +
          infoRow('剩余', ApiKeyUpsert.formatNumber(Math.max(0, quota - used)) + ' tokens') +
          infoRow('重置周期', plan.reset_period === 'monthly' ? '每月' : (plan.reset_period === 'weekly' ? '每周' : '永不重置')) +
          '<div class="quota-progress">' +
            '<div class="progress-label">使用进度</div>' +
            '<div class="proto-progress"><div class="proto-progress-inner" style="width:' + percent + '%"></div></div>' +
          '</div>' +
          '<div style="margin-top:16px;">' + IvuUI.btn('重置配额', 'primary', 'small', '', 'type="button" id="btn-api-reset-quota"') + '</div>'
        : '')
    );

    var rateCard = IvuUI.card('限流配置',
      infoRow('限流状态', IvuUI.tag(rateEnabled ? '已启用' : '未启用', rateEnabled ? 'success' : 'default')) +
      (rateEnabled
        ? infoRow('最大并发', maxConc === 0 ? '封禁' : (maxConc > 0 ? String(maxConc) : '不限制')) +
          (tpmRules.length ? ApiKeyUpsert.renderRulesDetail('TPM规则', tpmRules, 'tpm') : '') +
          (rpmRules.length ? ApiKeyUpsert.renderRulesDetail('RPM规则', rpmRules, 'rpm') : '')
        : '')
    );

    return '<div class="api-key-view">' +
      IvuUI.card('基本信息',
        infoRow('描述', IvuUI.escapeHtml(data.description || '-')) +
        infoRow('Key标识', IvuUI.escapeHtml(data.id || '-')) +
        infoRow('Key值', IvuUI.escapeHtml(data.key || '-') + (data.key ? ' ' + IvuUI.btn('复制', 'default', 'small', '', 'type="button"') : '')) +
        infoRow('状态', IvuUI.tag(data.enabled !== false ? '已启用' : '未启用', data.enabled !== false ? 'success' : 'default')) +
        infoRow('过期时间', '永不过期') +
        infoRow('无限配额', IvuUI.tag(data.unlimited_quota ? '是' : '否', data.unlimited_quota ? 'success' : 'default')) +
        infoRow('允许模型', ApiKeyUpsert.formatModelsText(data.models)) +
        infoRow('允许子网', IvuUI.escapeHtml(data.subnet || '*')) +
        infoRow('挂载Entity', IvuUI.escapeHtml((data.entity && data.entity.name) || '-')) +
        infoRow('创建时间', '2026-01-10 10:00:00') +
        infoRow('更新时间', '2026-03-01 15:30:00')
      ) +
      quotaCard +
      rateCard +
    '</div>';
  },

  renderRulesDetail(title, rules, type) {
    var items = rules.map(function (rule) {
      var lines = [
        '规则名称：' + (rule.name || '-'),
        '适用模型：' + (rule.model === '*' ? '全部模型' : rule.model)
      ];
      lines.push('时间窗口：' + (rule.window_minutes || '-') + '分钟');
      if (type === 'tpm') {
        lines.push('最大Token数：' + (rule.max_tokens || '-'));
        lines.push('滑动步长(分)：' + (rule.step_minutes || '-'));
      } else {
        lines.push('最大请求数：' + (rule.max_requests || '-'));
      }
      return '<div class="rule-detail-item">' + lines.map(function (l) { return '<div>' + l + '</div>'; }).join('') + '</div>';
    }).join('');
    return '<div class="rules-detail">' +
      '<div class="rules-detail-title">' + title + ' (' + rules.length + '条)</div>' + items +
    '</div>';
  },

  drawer(mode, data) {
    var title = mode === 'add' ? '创建 API-Key' : (mode === 'view' ? 'API-Key 详情' : '编辑 API-Key');
    var body = mode === 'view' ? ApiKeyUpsert.renderViewBody(data) : ApiKeyUpsert.renderUpsertBody(data, mode === 'add');
    var footer = mode === 'view'
      ? '<div class="com-btn-box drawer-footer api-key-drawer-footer">' +
          IvuUI.btn('关闭', 'default', 'default', '', 'id="btn-api-close"') +
        '</div>'
      : '<div class="com-btn-box drawer-footer api-key-drawer-footer">' +
          IvuUI.btn('取消', 'default', 'default', 'btn-box-del', 'id="btn-api-cancel"') + ' ' +
          IvuUI.btn('提交', 'primary', 'default', '', 'id="btn-api-submit"') +
        '</div>';
    return IvuUI.drawer('drawer-api-key', title, body, footer, '60%');
  },

  keyModal() {
    return '<div id="modal-api-key-value" class="ivu-modal-wrap proto-hidden">' +
      '<div class="ivu-modal-mask" data-close-modal="modal-api-key-value"></div>' +
      '<div class="ivu-modal proto-key-modal">' +
        '<div class="ivu-modal-content">' +
          '<div class="ivu-modal-header"><div class="ivu-modal-header-inner">API Key 管理 详情</div></div>' +
          '<div class="ivu-modal-body">' +
            '<div style="word-break:break-all;padding:20px 0;display:flex;align-items:center;gap:8px;">' +
              '<input id="modal-api-key-input" class="ivu-input" readonly style="width:90%;" />' +
              '<span class="proto-copy-icon" id="btn-api-copy-key" title="复制">📋</span>' +
            '</div>' +
          '</div>' +
          '<div class="ivu-modal-footer">' +
            IvuUI.btn('取消', 'primary', 'default', '', 'data-close-modal="modal-api-key-value"') +
          '</div>' +
        '</div></div></div>';
  },

  resetQuotaModal() {
    return '<div id="modal-api-reset-quota" class="ivu-modal-wrap proto-hidden">' +
      '<div class="ivu-modal-mask" data-close-modal="modal-api-reset-quota"></div>' +
      '<div class="ivu-modal reset-quota-modal">' +
        '<div class="ivu-modal-content">' +
          '<div class="ivu-modal-header"><div class="ivu-modal-header-inner">重置配额</div></div>' +
          '<div class="ivu-modal-body">' +
            '<div class="modal-form-item">' +
              '<div class="modal-label">新配额总量</div>' +
              IvuUI.inputNumber(0, 'id="modal-reset-quota-total" style="width:100%"') +
            '</div>' +
            '<p class="form-tip">设置后将重置已使用量为0，配额总量为新设置的值</p>' +
            '<div class="modal-form-item" style="margin-top:16px;">' +
              '<div class="modal-label">重置原因</div>' +
              '<div class="ivu-input-wrapper ivu-input-type-textarea">' +
                '<textarea id="modal-reset-quota-reason" class="ivu-input" rows="3" placeholder="请输入重置原因（可选）"></textarea>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ivu-modal-footer">' +
            IvuUI.btn('取消', 'default', 'default', '', 'data-close-modal="modal-api-reset-quota"') + ' ' +
            IvuUI.btn('确定', 'primary', 'default', '', 'id="btn-api-reset-quota-confirm"') +
          '</div>' +
        '</div></div></div>';
  }
};
