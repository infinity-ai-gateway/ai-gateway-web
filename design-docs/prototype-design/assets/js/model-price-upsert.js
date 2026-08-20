window.ModelPriceUpsert = {
  drawerId: 'model-price-drawer',
  data: null,
  isView: false,
  onSuccess: null,
  errors: { source: '', limits: '', prices: '' },

  drawer: function (data, isView, onSuccess) {
    this.data = data
      ? JSON.parse(JSON.stringify(data))
      : {
          id: null,
          provider: '',
          model: '',
          base_model: '',
          mode: 'chat',
          capabilities: [],
          supported_parameters: [],
          limits: [],
          prices: [],
          metadata: { source: '', notes: '' },
        };
    this.isView = isView;
    this.onSuccess = onSuccess || null;
    this.errors = { source: '', limits: '', prices: '' };

    // 转换对象为数组用于表单渲染
    if (!Array.isArray(this.data.limits)) {
      this.data.limits = this.objectToList(this.data.limits || {});
    }
    if (!Array.isArray(this.data.prices)) {
      this.data.prices = this.objectToList(this.data.prices || {});
    }

    var title = isView ? '查看' : data ? '编辑' : '创建';
    var body = this.renderBody();
    var footer = isView ? null : this.renderFooter();

    var oldDrawer = document.getElementById(this.drawerId);
    if (oldDrawer) oldDrawer.remove();

    var drawerHtml = IvuUI.drawer(this.drawerId, title, body, footer, '60%');
    document.body.insertAdjacentHTML('beforeend', drawerHtml);

    Prototype.openDrawer(this.drawerId);
    this.bindEvents();
  },

  objectToList: function (obj) {
    var list = [];
    Object.keys(obj || {}).forEach(function (key) {
      list.push({ key: key, value: obj[key] });
    });
    return list;
  },

  listToObject: function (list) {
    var obj = {};
    (list || []).forEach(function (item) {
      if (
        item.key !== '' &&
        item.value !== '' &&
        item.value !== null &&
        item.value !== undefined
      ) {
        obj[item.key] = Number(item.value);
      }
    });
    return obj;
  },

  renderBody: function () {
    var d = this.data;
    var isView = this.isView;
    var self = this;
    var modeOptions = MockData.modelModeOptions;
    var capOptions = MockData.modelCapabilities;
    var paramOptions = MockData.modelSupportedParameters;
    var limitKeys = MockData.modelLimitKeys;
    var priceKeys = MockData.modelPriceKeys;

    var modeSelectHtml = modeOptions
      .map(function (m) {
        return (
          '<option value="' +
          m +
          '"' +
          (d.mode === m ? ' selected' : '') +
          '>' +
          m +
          '</option>'
        );
      })
      .join('');

    var capsHtml = isView
      ? d.capabilities && d.capabilities.length
        ? d.capabilities
            .map(function (c) {
              return IvuUI.tag(c, 'primary');
            })
            .join(' ')
        : '-'
      : this.renderMultiSelectDropdown(
          'capabilities',
          capOptions,
          d.capabilities || [],
          '请选择模型能力',
        );

    var paramsHtml = isView
      ? d.supported_parameters && d.supported_parameters.length
        ? d.supported_parameters
            .map(function (p) {
              return IvuUI.tag(p, 'primary');
            })
            .join(' ')
        : '-'
      : this.renderMultiSelectDropdown(
          'supported_parameters',
          paramOptions,
          d.supported_parameters || [],
          '请选择支持参数',
        );

    var limitsHtml = isView
      ? this.renderViewKvTable(d.limits)
      : this.renderDynamicList('limits', limitKeys, d.limits, '键名', '值', 0);
    var pricesHtml = isView
      ? this.renderViewPriceTable(d.prices)
      : this.renderDynamicList(
          'prices',
          priceKeys,
          d.prices,
          '价格对象',
          '价格',
          8,
        );

    var basicInfoHtml =
      '<div class="ivu-row" style="margin:0 -12px;">' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '提供商',
        isView
          ? d.provider || '-'
          : '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input" id="field-provider" value="' +
              IvuUI.escapeHtml(d.provider || '') +
              '" placeholder="deepseek" /></div>',
        true,
      ) +
      '</div>' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '模型名',
        isView
          ? d.model || '-'
          : '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input" id="field-model" value="' +
              IvuUI.escapeHtml(d.model || '') +
              '" placeholder="DeepSeek V3" /></div>',
        true,
      ) +
      '</div>' +
      '</div>' +
      '<div class="ivu-row" style="margin:0 -12px;">' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '归一化模型名',
        isView
          ? d.base_model || '-'
          : '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input" id="field-base_model" value="' +
              IvuUI.escapeHtml(d.base_model || '') +
              '" placeholder="deepseek-v3" /></div>',
        true,
      ) +
      '</div>' +
      '<div class="ivu-col ivu-col-span-12" style="padding:0 12px;">' +
      IvuUI.formTopItem(
        '模型模式',
        isView
          ? d.mode || '-'
          : '<div class="ivu-select ivu-select-single" style="width:100%;">' +
              '<div class="ivu-select-selection">' +
              '<select id="field-mode" class="proto-ivu-select-native" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
              modeSelectHtml +
              '</select>' +
              '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
              '</div></div>',
        true,
      ) +
      '</div>' +
      '</div>';

    var metadataHtml = '';
    if (isView) {
      metadataHtml =
        '<div class="info-row"><div class="info-label">来源</div><div class="info-value">' +
        (d.metadata && d.metadata.source
          ? '<a href="' +
            IvuUI.escapeHtml(d.metadata.source) +
            '" target="_blank">' +
            IvuUI.escapeHtml(d.metadata.source) +
            '</a>'
          : '-') +
        '</div></div>' +
        '<div class="info-row"><div class="info-label">备注</div><div class="info-value">' +
        (d.metadata && d.metadata.notes
          ? IvuUI.escapeHtml(d.metadata.notes)
          : '-') +
        '</div></div>';
    } else {
      var sourceError = self.errors.source
        ? '<p class="error-text" style="color:#ed4014;margin-top:6px;">' +
          self.errors.source +
          '</p>'
        : '';
      metadataHtml =
        IvuUI.formTopItem(
          '来源',
          '<div class="ivu-input-wrapper ivu-input-type-text"><input type="text" class="ivu-input" id="field-meta-source" value="' +
            IvuUI.escapeHtml((d.metadata && d.metadata.source) || '') +
            '" placeholder="https://..." /></div>' +
            sourceError,
        ) +
        IvuUI.formTopItem(
          '备注',
          '<div class="ivu-input-wrapper ivu-input-type-textarea"><textarea class="ivu-input" id="field-meta-notes" rows="3">' +
            IvuUI.escapeHtml((d.metadata && d.metadata.notes) || '') +
            '</textarea></div>',
        );
    }

    var timestampsHtml = '';
    if (isView) {
      timestampsHtml = IvuUI.card(
        '时间戳',
        '<div class="info-row"><div class="info-label">创建时间</div><div class="info-value">' +
          this.formatTime(d.create_time) +
          '</div></div>' +
          '<div class="info-row"><div class="info-label">更新时间</div><div class="info-value">' +
          this.formatTime(d.update_time || d.create_time) +
          '</div></div>',
      );
    }

    var limitsError =
      !isView && self.errors.limits
        ? '<p class="error-text" style="color:#ed4014;margin-top:8px;">' +
          self.errors.limits +
          '</p>'
        : '';
    var pricesError =
      !isView && self.errors.prices
        ? '<p class="error-text" style="color:#ed4014;margin-top:8px;">' +
          self.errors.prices +
          '</p>'
        : '';

    return (
      IvuUI.card('基础信息', basicInfoHtml) +
      IvuUI.card('模型能力', capsHtml) +
      IvuUI.card('支持参数', paramsHtml) +
      IvuUI.card('限制对象', limitsHtml + limitsError) +
      IvuUI.card('价格对象', pricesHtml + pricesError) +
      IvuUI.card('元数据', metadataHtml) +
      timestampsHtml
    );
  },

  renderMultiSelect: function (field, options, selected, label) {
    var selectedMap = {};
    (selected || []).forEach(function (s) {
      selectedMap[s] = true;
    });

    var optionsHtml = options
      .map(function (opt) {
        return (
          '<label style="display:inline-block;margin:4px 12px 4px 0;cursor:pointer;">' +
          '<input type="checkbox" class="proto-multi-opt" data-field="' +
          field +
          '" value="' +
          opt +
          '"' +
          (selectedMap[opt] ? ' checked' : '') +
          ' style="margin-right:4px;" /> ' +
          opt +
          '</label>'
        );
      })
      .join('');

    return (
      '<div class="proto-multi-select" data-multi-field="' +
      field +
      '" style="padding:8px;border:1px solid #dcdee2;border-radius:4px;max-height:120px;overflow-y:auto;">' +
      optionsHtml +
      '</div>'
    );
  },

  renderMultiSelectDropdown: function (field, options, selected, placeholder) {
    var selectedMap = {};
    (selected || []).forEach(function (s) {
      selectedMap[s] = true;
    });

    var displayText =
      selected && selected.length
        ? selected.join(', ')
        : placeholder || '请选择';

    var optionsHtml = options
      .map(function (opt) {
        return (
          '<label class="proto-multi-dropdown-opt">' +
          '<input type="checkbox" class="proto-multi-opt" data-field="' +
          field +
          '" value="' +
          opt +
          '"' +
          (selectedMap[opt] ? ' checked' : '') +
          ' /> ' +
          opt +
          '</label>'
        );
      })
      .join('');

    return (
      '<div class="proto-multi-dropdown" data-multi-field="' +
      field +
      '" data-placeholder="' +
      IvuUI.escapeHtml(placeholder || '请选择') +
      '">' +
      '<div class="proto-multi-dropdown-trigger">' +
      '<span class="proto-multi-dropdown-text">' +
      IvuUI.escapeHtml(displayText) +
      '</span>' +
      '<span class="proto-multi-dropdown-arrow">▾</span>' +
      '</div>' +
      '<div class="proto-multi-dropdown-menu">' +
      optionsHtml +
      '</div>' +
      '</div>'
    );
  },

  renderDynamicList: function (
    field,
    keyOptions,
    items,
    keyPlaceholder,
    valuePlaceholder,
    precision,
  ) {
    precision = precision || 0;
    var rowsHtml = items
      .map(function (item, index) {
        var selectOptions = keyOptions
          .map(function (k) {
            return (
              '<option value="' +
              k +
              '"' +
              (item.key === k ? ' selected' : '') +
              '>' +
              k +
              '</option>'
            );
          })
          .join('');
        var step = precision ? '0.00000001' : '1';
        return (
          '<div class="proto-dynamic-row" data-row-index="' +
          index +
          '">' +
          '<div class="ivu-row" style="margin:0 -4px;">' +
          '<div class="ivu-col ivu-col-span-10" style="padding:0 4px;">' +
          '<div class="ivu-select ivu-select-single" style="width:100%;">' +
          '<div class="ivu-select-selection">' +
          '<select class="proto-dynamic-key proto-ivu-select-native" data-field="' +
          field +
          '" data-index="' +
          index +
          '" style="width:100%;height:32px;border:0;background:transparent;padding:0 24px 0 8px;appearance:none;">' +
          '<option value="">' +
          keyPlaceholder +
          '</option>' +
          selectOptions +
          '</select>' +
          '<span class="proto-select-arrow" aria-hidden="true">▾</span>' +
          '</div></div>' +
          '</div>' +
          '<div class="ivu-col ivu-col-span-10" style="padding:0 4px;">' +
          '<div class="ivu-input-number ivu-input-number-default" style="width:100%;">' +
          '<div class="ivu-input-number-input-wrap">' +
          '<input type="number" class="ivu-input-number-input proto-dynamic-value" data-field="' +
          field +
          '" data-index="' +
          index +
          '" value="' +
          (item.value != null ? item.value : 0) +
          '" placeholder="' +
          valuePlaceholder +
          '" min="0" step="' +
          step +
          '" />' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="ivu-col ivu-col-span-4" style="padding:0 4px;">' +
          '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small proto-dynamic-delete" data-field="' +
          field +
          '" data-index="' +
          index +
          '" style="width:100%;">删除</button>' +
          '</div>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    var addLabel = field === 'limits' ? '+ 添加限制' : '+ 添加价格';
    return (
      rowsHtml +
      '<button type="button" class="ivu-btn ivu-btn-primary proto-dynamic-add" data-field="' +
      field +
      '" style="margin-top:4px;">' +
      addLabel + '</button>'
    );
  },

  renderViewKvTable: function (items) {
    if (!items || !items.length) return '-';
    var rows = items
      .map(function (item) {
        return (
          '<tr>' +
          '<td style="padding:8px 16px;border:1px solid #e7e9f0;word-break:break-all;width:50%;background:#f8f8f9;">' +
          item.key +
          '</td>' +
          '<td style="padding:8px 16px;border:1px solid #e7e9f0;word-break:break-all;">' +
          item.value +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="kv-table" style="width:100%;border-collapse:collapse;border:1px solid #e7e9f0;"><tbody>' +
      rows +
      '</tbody></table>'
    );
  },

  renderViewPriceTable: function (items) {
    if (!items || !items.length) return '-';
    var rows = items
      .map(function (item) {
        return (
          '<tr>' +
          '<td style="padding:8px 16px;border:1px solid #e7e9f0;word-break:break-all;width:50%;background:#f8f8f9;">' +
          item.key +
          '</td>' +
          '<td style="padding:8px 16px;border:1px solid #e7e9f0;word-break:break-all;">¥' +
          item.value +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="kv-table" style="width:100%;border-collapse:collapse;border:1px solid #e7e9f0;"><tbody>' +
      rows +
      '</tbody></table>'
    );
  },

  renderFooter: function () {
    return (
      '<button type="button" class="ivu-btn ivu-btn-primary" id="btn-model-price-submit">提交</button>' +
      '<button type="button" class="ivu-btn" data-close-drawer="' +
      this.drawerId +
      '" style="margin-left:8px;">取消</button>'
    );
  },

  formatTime: function (ts) {
    if (!ts) return '-';
    try {
      var date = new Date(ts * 1000);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('zh-CN');
    } catch (e) {
      return ts;
    }
  },

  validateUrl: function (value) {
    var urlPattern =
      /^(https?:\/\/)?(([\w-]+\.)+[\w-]+|localhost)(:\d+)?(\/[\w.\/?%&=-]*)?$/i;
    return urlPattern.test(value);
  },

  getDuplicateKeys: function (list) {
    var seen = {};
    var duplicates = [];
    (list || []).forEach(function (item) {
      var key = item.key;
      if (!key) return;
      if (seen[key] && duplicates.indexOf(key) === -1) {
        duplicates.push(key);
      }
      seen[key] = true;
    });
    return duplicates;
  },

  validateDynamicKeys: function () {
    var limitsDuplicates = this.getDuplicateKeys(this.data.limits);
    var pricesDuplicates = this.getDuplicateKeys(this.data.prices);
    var limitsMsg = '';
    var pricesMsg = '';

    if (limitsDuplicates.length > 0) {
      limitsMsg = '限制对象存在重复的键';
    }
    if (pricesDuplicates.length > 0) {
      pricesMsg = '价格对象存在重复的键';
    }

    // limits 值须为非负整数；prices 值须为非负数
    var limitsValueInvalid = this.data.limits.some(function (item) {
      if (!item.key) return false;
      var value = Number(item.value);
      return isNaN(value) || value < 0 || Math.floor(value) !== value;
    });
    var pricesValueInvalid = this.data.prices.some(function (item) {
      if (!item.key) return false;
      var value = Number(item.value);
      return isNaN(value) || value < 0;
    });

    if (!limitsMsg && limitsValueInvalid) {
      limitsMsg = '限制对象的值必须为非负整数';
    }
    if (!pricesMsg && pricesValueInvalid) {
      pricesMsg = '价格对象的值必须为非负数';
    }

    this.errors.limits = limitsMsg;
    this.errors.prices = pricesMsg;

    if (limitsMsg || pricesMsg) {
      this.refreshBody();
      Prototype.toast(limitsMsg || pricesMsg, 'error');
      return false;
    }
    return true;
  },

  bindEvents: function () {
    var self = this;
    var drawer = document.getElementById(this.drawerId);
    if (!drawer) return;

    // 动态列表添加
    drawer.querySelectorAll('.proto-dynamic-add').forEach(function (btn) {
      btn.onclick = function () {
        var field = btn.getAttribute('data-field');
        self.data[field].push({ key: '', value: 0 });
        self.refreshBody();
      };
    });

    // 动态列表删除
    drawer.querySelectorAll('.proto-dynamic-delete').forEach(function (btn) {
      btn.onclick = function () {
        var field = btn.getAttribute('data-field');
        var index = parseInt(btn.getAttribute('data-index'), 10);
        self.data[field].splice(index, 1);
        self.refreshBody();
      };
    });

    // 动态列表key变化
    drawer.querySelectorAll('.proto-dynamic-key').forEach(function (sel) {
      sel.onchange = function () {
        var field = sel.getAttribute('data-field');
        var index = parseInt(sel.getAttribute('data-index'), 10);
        self.data[field][index].key = sel.value;
      };
    });

    // 动态列表value变化
    drawer.querySelectorAll('.proto-dynamic-value').forEach(function (input) {
      input.oninput = function () {
        var field = input.getAttribute('data-field');
        var index = parseInt(input.getAttribute('data-index'), 10);
        var val = parseFloat(input.value);
        self.data[field][index].value = isNaN(val) ? 0 : val;
      };
    });

    // 多选下拉展开/收起
    drawer.querySelectorAll('.proto-multi-dropdown-trigger').forEach(function (trigger) {
      trigger.onclick = function (e) {
        e.stopPropagation();
        var dropdown = trigger.closest('.proto-multi-dropdown');
        if (dropdown) {
          dropdown.classList.toggle('open');
        }
      };
    });
    document.addEventListener('click', function (e) {
      drawer.querySelectorAll('.proto-multi-dropdown.open').forEach(function (dropdown) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    });

    // 多选
    drawer.querySelectorAll('.proto-multi-opt').forEach(function (cb) {
      cb.onchange = function () {
        var field = cb.getAttribute('data-field');
        var checked = [];
        drawer
          .querySelectorAll(
            '.proto-multi-opt[data-field="' + field + '"]:checked',
          )
          .forEach(function (c) {
            checked.push(c.value);
          });
        self.data[field] = checked;
        var dropdown = cb.closest('.proto-multi-dropdown');
        if (dropdown) {
          var triggerText = dropdown.querySelector('.proto-multi-dropdown-text');
          var placeholder = dropdown.getAttribute('data-placeholder') || '请选择';
          if (triggerText) {
            triggerText.textContent = checked.length ? checked.join(', ') : placeholder;
          }
        }
      };
    });

    // 提交
    var submitBtn = document.getElementById('btn-model-price-submit');
    if (submitBtn) {
      submitBtn.onclick = function () {
        self.handleSubmit();
      };
    }
  },

  refreshBody: function () {
    var drawer = document.getElementById(this.drawerId);
    if (!drawer) return;
    var bodyEl = drawer.querySelector('.ivu-drawer-body');
    if (bodyEl) bodyEl.innerHTML = this.renderBody();
    this.bindEvents();
  },

  handleSubmit: function () {
    var d = this.data;
    this.errors = { source: '', limits: '', prices: '' };

    // 收集表单值
    var providerEl = document.getElementById('field-provider');
    var modelEl = document.getElementById('field-model');
    var baseModelEl = document.getElementById('field-base_model');
    var modeEl = document.getElementById('field-mode');
    var metaSourceEl = document.getElementById('field-meta-source');
    var metaNotesEl = document.getElementById('field-meta-notes');

    if (providerEl) d.provider = providerEl.value.trim();
    if (modelEl) d.model = modelEl.value.trim();
    if (baseModelEl) d.base_model = baseModelEl.value.trim();
    if (modeEl) d.mode = modeEl.value;
    if (!d.metadata) d.metadata = {};
    if (metaSourceEl) d.metadata.source = metaSourceEl.value.trim();
    if (metaNotesEl) d.metadata.notes = metaNotesEl.value;

    // 必填校验
    if (!d.provider) {
      Prototype.toast('请输入提供商', 'error');
      return;
    }
    if (d.provider.length > 255) {
      Prototype.toast('提供商长度不能超过 255', 'error');
      return;
    }
    if (!d.model) {
      Prototype.toast('请输入模型名', 'error');
      return;
    }
    if (d.model.length > 255) {
      Prototype.toast('模型名长度不能超过 255', 'error');
      return;
    }
    if (!d.base_model) {
      Prototype.toast('请输入归一化模型名', 'error');
      return;
    }
    if (d.base_model.length > 255) {
      Prototype.toast('归一化模型名长度不能超过 255', 'error');
      return;
    }
    if (!d.mode) {
      Prototype.toast('请选择模型模式', 'error');
      return;
    }

    // 来源 URL 校验
    if (d.metadata.source && !this.validateUrl(d.metadata.source)) {
      this.errors.source = '请输入正确的 URL 地址';
      this.refreshBody();
      Prototype.toast('请输入正确的 URL 地址', 'error');
      return;
    }

    // 动态列表校验
    if (!this.validateDynamicKeys()) {
      return;
    }

    // 校验价格对象至少一个
    var priceObj = this.listToObject(d.prices);
    if (Object.keys(priceObj).length === 0) {
      this.errors.prices = '请至少添加一项价格';
      this.refreshBody();
      Prototype.toast('请至少添加一项价格', 'error');
      return;
    }

    // 编辑模式下 provider/model/mode 均未改动，跳过组合唯一性校验
    var isEdit = !!d.id;
    var orig = null;
    if (isEdit) {
      orig = MockData.modelPrices.find(function (p) {
        return p.id === d.id;
      });
    }
    var unchanged =
      isEdit &&
      orig &&
      orig.provider === d.provider &&
      orig.model === d.model &&
      orig.mode === d.mode;

    if (!unchanged) {
      var duplicate = MockData.modelPrices.find(function (p) {
        return (
          p.id !== d.id &&
          p.provider === d.provider &&
          p.model === d.model &&
          p.mode === d.mode
        );
      });
      if (duplicate) {
        Prototype.toast('已存在相同提供商、模型名、模型模式的价格配置', 'error');
        return;
      }
    }

    // 构建提交数据
    var payload = {
      provider: d.provider,
      model: d.model,
      base_model: d.base_model,
      mode: d.mode,
      capabilities: d.capabilities || [],
      supported_parameters: d.supported_parameters || [],
      limits: this.listToObject(d.limits),
      prices: priceObj,
      metadata: d.metadata || {},
    };

    if (d.id) {
      // 编辑
      var idx = MockData.modelPrices.findIndex(function (p) {
        return p.id === d.id;
      });
      if (idx >= 0) {
        payload.id = d.id;
        payload.create_time = MockData.modelPrices[idx].create_time;
        payload.update_time = Math.floor(Date.now() / 1000);
        MockData.modelPrices[idx] = payload;
      }
      Prototype.toast('编辑成功!');
    } else {
      // 创建
      var maxId = 0;
      MockData.modelPrices.forEach(function (p) {
        if (p.id > maxId) maxId = p.id;
      });
      payload.id = maxId + 1;
      payload.create_time = Math.floor(Date.now() / 1000);
      payload.update_time = payload.create_time;
      MockData.modelPrices.push(payload);
      Prototype.toast('创建成功!');
    }

    Prototype.closeDrawer(this.drawerId);
    if (typeof this.onSuccess === 'function') {
      this.onSuccess();
    }
  },
};
