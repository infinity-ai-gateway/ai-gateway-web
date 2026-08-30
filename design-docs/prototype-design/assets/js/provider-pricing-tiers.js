window.ProviderPricingTiers = (function () {
  var PEAK_TIER_NAME = 'peak';
  var WEEKDAY_OPTIONS = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
  ];
  function isValidIanaTimeZone(tz) {
    var value = String(tz || '').trim();
    if (!value) return false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch (e) {
      return false;
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function getPeakTier(row) {
    var peak = ((row && row.tiers) || []).find(function (t) {
      return t && t.name === PEAK_TIER_NAME;
    });
    return {
      name: PEAK_TIER_NAME,
      time_ranges:
        peak && peak.time_ranges && peak.time_ranges.length
          ? clone(peak.time_ranges)
          : [{ weekdays: [1, 2, 3, 4, 5], start: '09:00', end: '12:00' }],
    };
  }

  function createDefaultPayload(row) {
    row = row || {};
    return {
      providerName: row.name || '',
      time_zone: row.time_zone || 'Asia/Shanghai',
      peak: getPeakTier(row),
    };
  }

  function toSubmitPayload(data) {
    return {
      time_zone: data.time_zone,
      tiers: [clone(data.peak)],
    };
  }

  function formatWeekdays(weekdays) {
    if (!weekdays || !weekdays.length) return '每天';
    return WEEKDAY_OPTIONS.filter(function (opt) {
      return weekdays.indexOf(opt.value) !== -1;
    })
      .map(function (opt) {
        return opt.label;
      })
      .join('、');
  }

  function parseHHMM(value) {
    var parts = String(value || '').split(':');
    if (parts.length !== 2) return NaN;
    var hour = Number(parts[0]);
    var min = Number(parts[1]);
    if (!Number.isFinite(hour) || !Number.isFinite(min)) return NaN;
    if (hour < 0 || hour > 23 || min < 0 || min > 59) return NaN;
    return hour * 60 + min;
  }

  function validateHHMM(value, label) {
    if (!/^\d{2}:\d{2}$/.test(String(value || ''))) {
      return label + ' 须为 HH:MM 格式';
    }
    if (Number.isNaN(parseHHMM(value))) {
      return label + ' 时间无效';
    }
    return null;
  }

  function rangesOverlap(a, b) {
    var aDays = a.weekdays && a.weekdays.length ? a.weekdays.slice() : [0, 1, 2, 3, 4, 5, 6];
    var bDays = b.weekdays && b.weekdays.length ? b.weekdays.slice() : [0, 1, 2, 3, 4, 5, 6];
    var shared = aDays.filter(function (d) {
      return bDays.indexOf(d) !== -1;
    });
    if (!shared.length) return false;
    return parseHHMM(a.start) < parseHHMM(b.end) && parseHHMM(b.start) < parseHHMM(a.end);
  }

  function validatePayload(data) {
    var timeZone = (data.time_zone || '').trim();
    if (!timeZone) return '请填写时区';
    if (!isValidIanaTimeZone(timeZone)) {
      return '时区须为合法 IANA 时区名';
    }

    var ranges = (data.peak && data.peak.time_ranges) || [];
    if (!ranges.length) return '忙时至少包含 1 个时间段';
    for (var i = 0; i < ranges.length; i++) {
      var tr = ranges[i];
      if (tr.weekdays && tr.weekdays.length) {
        for (var j = 0; j < tr.weekdays.length; j++) {
          var wd = Number(tr.weekdays[j]);
          if (!Number.isFinite(wd) || wd < 0 || wd > 6) {
            return '第 ' + (i + 1) + ' 个时间段的适用时段无效';
          }
        }
      }
      var startErr = validateHHMM(tr.start, '第 ' + (i + 1) + ' 个时间段开始时间');
      if (startErr) return startErr;
      var endErr = validateHHMM(tr.end, '第 ' + (i + 1) + ' 个时间段结束时间');
      if (endErr) return endErr;
      if (parseHHMM(tr.end) <= parseHHMM(tr.start)) {
        return '第 ' + (i + 1) + ' 个时间段结束时间须大于开始时间';
      }
      for (var k = i + 1; k < ranges.length; k++) {
        if (rangesOverlap(tr, ranges[k])) {
          return '第 ' + (i + 1) + ' 与第 ' + (k + 1) + ' 个时间段存在重叠';
        }
      }
    }
    return null;
  }

  function arraysEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    var sa = a.slice().sort(function (x, y) {
      return x - y;
    });
    var sb = b.slice().sort(function (x, y) {
      return x - y;
    });
    for (var i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) return false;
    }
    return true;
  }

  function renderWeekdayPicker(selected, rangeIndex) {
    var selectedList = (selected || []).slice();
    var isEveryDay = !selectedList.length;
    var selectedMap = {};
    selectedList.forEach(function (d) {
      selectedMap[Number(d)] = true;
    });

    var displayOrder = [1, 2, 3, 4, 5, 6, 0];
    var checkboxes = displayOrder
      .map(function (val) {
        var opt = WEEKDAY_OPTIONS.find(function (o) {
          return o.value === val;
        });
        var on = isEveryDay || selectedMap[val];
        return (
          '<label class="proto-weekday-checkbox">' +
          '<input type="checkbox" class="proto-weekday-check" data-range-index="' +
          rangeIndex +
          '" data-value="' +
          val +
          '"' +
          (on ? ' checked' : '') +
          ' /> ' +
          IvuUI.escapeHtml(opt.label) +
          '</label>'
        );
      })
      .join('');

    var quickLinks =
      '<span class="proto-weekday-quick-label">快捷</span>' +
      '<button type="button" class="proto-weekday-quick-link" data-range-index="' +
      rangeIndex +
      '" data-preset="all">全选</button>' +
      '<span class="proto-weekday-quick-sep">|</span>' +
      '<button type="button" class="proto-weekday-quick-link" data-range-index="' +
      rangeIndex +
      '" data-preset="workday">工作日</button>' +
      '<span class="proto-weekday-quick-sep">|</span>' +
      '<button type="button" class="proto-weekday-quick-link" data-range-index="' +
      rangeIndex +
      '" data-preset="weekend">周末</button>';

    return (
      '<div class="proto-weekday-picker" data-range-index="' +
      rangeIndex +
      '">' +
      '<div class="proto-weekday-row">' +
      '<div class="proto-weekday-checkboxes">' +
      checkboxes +
      '</div>' +
      '<div class="proto-weekday-quick">' +
      quickLinks +
      '</div></div></div>'
    );
  }

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function parseTimeValue(value, fallback) {
    fallback = fallback || '09:00';
    var parts = String(value || fallback).split(':');
    var hour = Number(parts[0]);
    var minute = Number(parts[1]);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) hour = 9;
    if (!Number.isFinite(minute) || minute < 0 || minute > 59) minute = 0;
    return { hour: pad2(hour), minute: pad2(minute) };
  }

  function renderTimePicker(value, rangeIndex, field) {
    var parsed = parseTimeValue(value, field === 'end' ? '18:00' : '09:00');
    var timeValue = parsed.hour + ':' + parsed.minute;
    return (
      '<div class="proto-time-picker" data-range-index="' +
      rangeIndex +
      '" data-field="' +
      field +
      '">' +
      '<div class="ivu-input-wrapper ivu-input-type-text proto-time-input-wrap">' +
      '<input type="time" class="ivu-input proto-time-input" data-range-index="' +
      rangeIndex +
      '" data-field="' +
      field +
      '" value="' +
      timeValue +
      '" step="60" />' +
      '</div></div>'
    );
  }

  function readTimePicker(row, field) {
    var input = row.querySelector('.proto-time-input[data-field="' + field + '"]');
    if (!input || !input.value) return '';
    return parseTimeValue(input.value).hour + ':' + parseTimeValue(input.value).minute;
  }

  function renderTimeRangesTable(peak) {
    var ranges = peak.time_ranges || [];
    var rows = ranges
      .map(function (tr, rangeIndex) {
        return (
          '<tr data-range-index="' +
          rangeIndex +
          '">' +
          '<td>' +
          renderWeekdayPicker(tr.weekdays, rangeIndex) +
          '</td>' +
          '<td class="proto-time-cell">' +
          renderTimePicker(tr.start, rangeIndex, 'start') +
          '</td>' +
          '<td class="proto-time-cell">' +
          renderTimePicker(tr.end, rangeIndex, 'end') +
          '</td>' +
          '<td style="width:80px;">' +
          '<button type="button" class="ivu-btn ivu-btn-error ivu-btn-small proto-range-remove" data-range-index="' +
          rangeIndex +
          '"' +
          (ranges.length <= 1 ? ' disabled="disabled"' : '') +
          '><span>删除</span></button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<table class="mapping-table proto-pricing-tiers-table">' +
      '<thead><tr>' +
      '<th>适用时段</th><th class="proto-time-col">开始时间</th><th class="proto-time-col">结束时间</th><th style="width:80px;">操作</th>' +
      '</tr></thead><tbody id="pricing-tiers-range-body">' +
      rows +
      '</tbody></table>' +
      '<button type="button" class="ivu-btn ivu-btn-default ivu-btn-small" id="pricing-tiers-add-range" style="margin-top:12px;"><span>+ 添加时间段</span></button>'
    );
  }

  function renderTimeZoneInput(value) {
    return (
      '<div class="ivu-input-wrapper ivu-input-type-text">' +
      '<input type="text" class="ivu-input" id="pricing-tiers-time-zone" value="' +
      IvuUI.escapeHtml(value || '') +
      '" placeholder="如 Asia/Shanghai" />' +
      '</div>'
    );
  }

  function renderForm(data) {
    return (
      '<div class="gateway-config provider-pricing-tiers-form">' +
      IvuUI.formTop(
        IvuUI.formTopItem(
          '服务商名称',
          '<span class="proto-pricing-tiers-provider-name">' +
            IvuUI.escapeHtml(data.providerName || '-') +
            '</span>',
        ) +
          IvuUI.formTopItem('时区', renderTimeZoneInput(data.time_zone), true) +
          IvuUI.formTopItem(
            '计价时段',
            '<span class="ivu-tag ivu-tag-warning ivu-tag-checked">忙时</span>' +
              '<span class="proto-pricing-tier-code">peak</span>',
          ) +
          IvuUI.formTopItem('时间段', renderTimeRangesTable(data.peak) +
            '<p id="pricing-tiers-error" class="proto-instance-error" style="display:none;"></p>'),
      ) +
      '</div>'
    );
  }

  function syncFromDom(bodyEl, data) {
    var tzEl = bodyEl.querySelector('#pricing-tiers-time-zone');
    if (tzEl) data.time_zone = tzEl.value;

    data.peak.name = PEAK_TIER_NAME;
    data.peak.time_ranges = [];
    bodyEl.querySelectorAll('#pricing-tiers-range-body tr[data-range-index]').forEach(function (row) {
      var rangeIndex = parseInt(row.getAttribute('data-range-index'), 10);
      var weekdays = [];
      var picker = bodyEl.querySelector('.proto-weekday-picker[data-range-index="' + rangeIndex + '"]');
      if (picker) {
        picker.querySelectorAll('.proto-weekday-check:checked').forEach(function (cb) {
          weekdays.push(Number(cb.getAttribute('data-value')));
        });
        if (weekdays.length === 7) {
          weekdays = [];
        }
      }
      weekdays.sort(function (a, b) {
        return a - b;
      });
      data.peak.time_ranges.push({
        weekdays: weekdays,
        start: readTimePicker(row, 'start'),
        end: readTimePicker(row, 'end'),
      });
    });
  }

  function applyWeekdayPreset(bodyEl, state, rangeIndex, preset) {
    syncFromDom(bodyEl, state.data);
    var tr = state.data.peak.time_ranges[rangeIndex];
    if (!tr) return;
    if (preset === 'all') tr.weekdays = [];
    else if (preset === 'workday') tr.weekdays = [1, 2, 3, 4, 5];
    else if (preset === 'weekend') tr.weekdays = [0, 6];
  }

  function syncWeekdaysFromPicker(bodyEl, state, rangeIndex) {
    syncFromDom(bodyEl, state.data);
    var picker = bodyEl.querySelector('.proto-weekday-picker[data-range-index="' + rangeIndex + '"]');
    if (!picker) return;
    var checked = [];
    picker.querySelectorAll('.proto-weekday-check:checked').forEach(function (cb) {
      checked.push(Number(cb.getAttribute('data-value')));
    });
    checked.sort(function (a, b) {
      return a - b;
    });
    var tr = state.data.peak.time_ranges[rangeIndex];
    if (!tr) return;
    tr.weekdays = checked.length === 7 || checked.length === 0 ? [] : checked;
  }

  function mount(bodyEl, footerEl, options) {
    options = options || {};
    var state = {
      data: createDefaultPayload(options.row),
    };

    function render() {
      bodyEl.innerHTML = renderForm(state.data);
      if (footerEl) {
        footerEl.innerHTML =
          IvuUI.btn('提交', 'primary', 'small', '', 'id="pricing-tiers-submit"') +
          ' ' +
          IvuUI.btn('取消', 'default', 'small', '', 'id="pricing-tiers-cancel"');
      }
      bindEvents();
    }

    function showError(msg) {
      var errEl = bodyEl.querySelector('#pricing-tiers-error');
      if (!errEl) return;
      errEl.textContent = msg || '';
      errEl.style.display = msg ? 'block' : 'none';
    }

    function bindEvents() {
      var cancelBtn = footerEl && footerEl.querySelector('#pricing-tiers-cancel');
      if (cancelBtn && typeof options.onCancel === 'function') {
        cancelBtn.addEventListener('click', options.onCancel);
      }

      var addBtn = bodyEl.querySelector('#pricing-tiers-add-range');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          state.data.peak.time_ranges.push({
            weekdays: [1, 2, 3, 4, 5],
            start: '09:00',
            end: '12:00',
          });
          render();
        });
      }

      bodyEl.querySelectorAll('.proto-range-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          if (state.data.peak.time_ranges.length <= 1) {
            Prototype.toast('至少保留 1 个时间段', 'error');
            return;
          }
          state.data.peak.time_ranges.splice(parseInt(btn.getAttribute('data-range-index'), 10), 1);
          render();
        });
      });

      bodyEl.querySelectorAll('.proto-weekday-quick-link').forEach(function (btn) {
        btn.addEventListener('click', function () {
          applyWeekdayPreset(
            bodyEl,
            state,
            parseInt(btn.getAttribute('data-range-index'), 10),
            btn.getAttribute('data-preset'),
          );
          render();
        });
      });

      bodyEl.querySelectorAll('.proto-weekday-check').forEach(function (cb) {
        cb.addEventListener('change', function () {
          syncWeekdaysFromPicker(
            bodyEl,
            state,
            parseInt(cb.getAttribute('data-range-index'), 10),
          );
          render();
        });
      });

      var submitBtn = footerEl && footerEl.querySelector('#pricing-tiers-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          syncFromDom(bodyEl, state.data);
          var err = validatePayload(state.data);
          if (err) {
            showError(err);
            Prototype.toast(err, 'error');
            return;
          }
          showError('');
          if (typeof options.onSubmit === 'function') {
            options.onSubmit(toSubmitPayload(state.data));
          }
        });
      }
    }

    render();
    return {
      getData: function () {
        return state.data;
      },
    };
  }

  return {
    PEAK_TIER_NAME: PEAK_TIER_NAME,
    WEEKDAY_OPTIONS: WEEKDAY_OPTIONS,
    formatWeekdays: formatWeekdays,
    getPeakTier: getPeakTier,
    createDefaultPayload: createDefaultPayload,
    toSubmitPayload: toSubmitPayload,
    mount: mount,
  };
})();
