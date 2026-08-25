/**
* Copyright(c) 2026 The Rainway AI Gateway (壬远AI网关) Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http: //www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
<template>
  <div class="provider-pricing-tiers">
    <Form label-position="top">
      <FormItem :label="$t('provider.pricingProviderName')">
        <span class="provider-name">{{ providerName || '-' }}</span>
      </FormItem>
      <FormItem :label="$t('provider.pricingTimeZone')" required>
        <Input
          v-model="timeZone"
          :placeholder="$t('provider.pricingTimeZonePlaceholder')"
          @on-change="timeZoneError = ''"
        />
        <p v-if="timeZoneError" class="error-text">{{ timeZoneError }}</p>
      </FormItem>
      <FormItem :label="$t('provider.pricingTierType')">
        <span class="ivu-tag ivu-tag-warning ivu-tag-checked">{{ $t('provider.pricingPeakTag') }}</span>
      </FormItem>
      <FormItem :label="$t('provider.pricingTimeRanges')">
        <table class="ranges-table">
          <thead>
            <tr>
              <th>{{ $t('provider.pricingWeekdays') }}</th>
              <th class="time-col">{{ $t('provider.pricingStartTime') }}</th>
              <th class="time-col">{{ $t('provider.pricingEndTime') }}</th>
              <th style="width: 80px;">{{ $t('com.operation') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(range, index) in timeRanges" :key="index">
              <td>
                <div class="weekday-picker">
                  <div class="weekday-row">
                    <CheckboxGroup
                      class="weekday-checkboxes"
                      :value="getWeekdaySelection(range.weekdays)"
                      @on-change="values => onWeekdaysChange(index, values)"
                    >
                      <Checkbox
                        v-for="day in WEEKDAY_OPTIONS"
                        :key="day.value"
                        :label="day.value"
                      >
                        {{ day.label }}
                      </Checkbox>
                    </CheckboxGroup>
                    <div class="weekday-quick">
                      <span class="weekday-quick-label">{{ $t('provider.weekdaysQuick') }}</span>
                      <button
                        type="button"
                        class="weekday-quick-link"
                        @click="setPreset(index, 'all')"
                      >
                        {{ $t('provider.weekdaysSelectAll') }}
                      </button>
                      <span class="weekday-quick-sep">|</span>
                      <button
                        type="button"
                        class="weekday-quick-link"
                        @click="setPreset(index, 'workday')"
                      >
                        {{ $t('provider.weekdaysWorkday') }}
                      </button>
                      <span class="weekday-quick-sep">|</span>
                      <button
                        type="button"
                        class="weekday-quick-link"
                        @click="setPreset(index, 'weekend')"
                      >
                        {{ $t('provider.weekdaysWeekend') }}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td class="time-cell">
                <input v-model="range.start" type="time" class="time-input" step="60" />
              </td>
              <td class="time-cell">
                <input v-model="range.end" type="time" class="time-input" step="60" />
              </td>
              <td>
                <Button
                  type="error"
                  size="small"
                  :disabled="timeRanges.length <= 1"
                  @click="removeRange(index)"
                >
                  {{ $t('com.del') }}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
        <Button size="small" style="margin-top: 12px;" @click="addRange">
          + {{ $t('provider.addTimeRange') }}
        </Button>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </FormItem>
    </Form>
    <div class="drawer-footer">
      <Button type="primary" size="small" :loading="submitting" @click="handleSubmit">
        {{ $t('com.submit') }}
      </Button>
      <Button size="small" style="margin-left: 8px;" @click="$emit('cancel')">
        {{ $t('com.cancel') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { isValidIanaTimeZone } from '@/utils/tool';

const PEAK_TIER_NAME = 'peak';
const WORKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default {
    name: 'ProviderPricingTiers',

    props: {
        currentProvider: {
            type: Object,
            default() {
                return {};
            }
        }
    },

    data() {
        return {
            WORKDAYS,
            WEEKEND,
            timeZone: 'Asia/Shanghai',
            timeZoneError: '',
            timeRanges: [this.createDefaultRange()],
            submitting: false,
            errorText: ''
        };
    },

    computed: {
        providerName() {
            return this.currentProvider.name || '';
        },
        WEEKDAY_OPTIONS() {
            return [
                { value: 1, short: this.$t('provider.weekdayMon'), label: this.$t('provider.weekdayMonFull') },
                { value: 2, short: this.$t('provider.weekdayTue'), label: this.$t('provider.weekdayTueFull') },
                { value: 3, short: this.$t('provider.weekdayWed'), label: this.$t('provider.weekdayWedFull') },
                { value: 4, short: this.$t('provider.weekdayThu'), label: this.$t('provider.weekdayThuFull') },
                { value: 5, short: this.$t('provider.weekdayFri'), label: this.$t('provider.weekdayFriFull') },
                { value: 6, short: this.$t('provider.weekdaySat'), label: this.$t('provider.weekdaySatFull') },
                { value: 0, short: this.$t('provider.weekdaySun'), label: this.$t('provider.weekdaySunFull') }
            ];
        }
    },

    watch: {
        currentProvider: {
            handler() {
                this.initFromProvider(this.currentProvider);
            },
            immediate: true,
            deep: true
        }
    },

    methods: {
        createDefaultRange() {
            return { weekdays: WORKDAYS.slice(), start: '09:00', end: '12:00' };
        },
        initFromProvider(row) {
            this.timeZone = row.time_zone || 'Asia/Shanghai';
            const peak = (row.tiers || []).find(item => item && item.name === PEAK_TIER_NAME);
            const ranges = peak && peak.time_ranges && peak.time_ranges.length
                ? peak.time_ranges
                : [this.createDefaultRange()];
            this.timeRanges = ranges.map(item => ({
                weekdays: Array.isArray(item.weekdays) ? item.weekdays.slice() : [],
                start: this.normalizeTime(item.start, '09:00'),
                end: this.normalizeTime(item.end, '12:00')
            }));
            this.errorText = '';
            this.timeZoneError = '';
        },
        normalizeTime(value, fallback) {
            const parts = String(value || fallback).split(':');
            const hour = Number(parts[0]);
            const minute = Number(parts[1]);
            const h = Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 9;
            const m = Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        },
        isEveryDay(weekdays) {
            return !weekdays || !weekdays.length;
        },
        getWeekdaySelection(weekdays) {
            if (this.isEveryDay(weekdays)) {
                return ALL_DAYS.slice();
            }
            return (weekdays || []).slice();
        },
        onWeekdaysChange(index, values) {
            const list = (values || [])
                .map(day => Number(day))
                .filter(day => Number.isFinite(day) && day >= 0 && day <= 6)
                .sort((a, b) => a - b);
            if (!list.length) {
                this.timeRanges[index].weekdays = [];
                return;
            }
            this.timeRanges[index].weekdays = list.length === ALL_DAYS.length ? [] : list;
        },
        setPreset(index, preset) {
            if (preset === 'all') {
                this.timeRanges[index].weekdays = [];
            } else if (preset === 'workday') {
                this.timeRanges[index].weekdays = WORKDAYS.slice();
            } else if (preset === 'weekend') {
                this.timeRanges[index].weekdays = WEEKEND.slice();
            }
        },
        addRange() {
            this.timeRanges.push(this.createDefaultRange());
        },
        removeRange(index) {
            if (this.timeRanges.length <= 1) {
                this.$Message.error(this.$t('provider.pricingKeepOneRange'));
                return;
            }
            this.timeRanges.splice(index, 1);
        },
        parseHHMM(value) {
            const parts = String(value || '').split(':');
            if (parts.length < 2) {
                return NaN;
            }
            const hour = Number(parts[0]);
            const min = Number(parts[1]);
            if (!Number.isFinite(hour) || !Number.isFinite(min)) {
                return NaN;
            }
            if (hour < 0 || hour > 23 || min < 0 || min > 59) {
                return NaN;
            }
            return hour * 60 + min;
        },
        rangesOverlap(a, b) {
            const aDays = a.weekdays && a.weekdays.length ? a.weekdays : [0, 1, 2, 3, 4, 5, 6];
            const bDays = b.weekdays && b.weekdays.length ? b.weekdays : [0, 1, 2, 3, 4, 5, 6];
            const shared = aDays.filter(day => bDays.indexOf(day) !== -1);
            if (!shared.length) {
                return false;
            }
            return this.parseHHMM(a.start) < this.parseHHMM(b.end)
                && this.parseHHMM(b.start) < this.parseHHMM(a.end);
        },
        validate() {
            this.timeZoneError = '';
            this.errorText = '';
            const timeZone = String(this.timeZone || '').trim();
            if (!timeZone) {
                this.timeZoneError = this.$t('provider.pricingTimeZoneRequired');
                return this.timeZoneError;
            }
            if (!isValidIanaTimeZone(timeZone)) {
                this.timeZoneError = this.$t('provider.pricingTimeZoneInvalid');
                return this.timeZoneError;
            }
            if (!this.timeRanges.length) {
                this.errorText = this.$t('provider.pricingNeedTimeRange');
                return this.errorText;
            }
            for (let i = 0; i < this.timeRanges.length; i++) {
                const tr = this.timeRanges[i];
                const index = i + 1;
                if (tr.weekdays && tr.weekdays.length) {
                    const invalid = tr.weekdays.some(day => !Number.isFinite(Number(day)) || day < 0 || day > 6);
                    if (invalid) {
                        this.errorText = this.$t('provider.pricingWeekdaysInvalid', { index });
                        return this.errorText;
                    }
                }
                if (!/^\d{2}:\d{2}$/.test(String(tr.start || ''))) {
                    this.errorText = this.$t('provider.pricingTimeFormatInvalid', {
                        index,
                        field: this.$t('provider.pricingStartTime')
                    });
                    return this.errorText;
                }
                if (!/^\d{2}:\d{2}$/.test(String(tr.end || ''))) {
                    this.errorText = this.$t('provider.pricingTimeFormatInvalid', {
                        index,
                        field: this.$t('provider.pricingEndTime')
                    });
                    return this.errorText;
                }
                if (Number.isNaN(this.parseHHMM(tr.start))) {
                    this.errorText = this.$t('provider.pricingTimeInvalid', {
                        index,
                        field: this.$t('provider.pricingStartTime')
                    });
                    return this.errorText;
                }
                if (Number.isNaN(this.parseHHMM(tr.end))) {
                    this.errorText = this.$t('provider.pricingTimeInvalid', {
                        index,
                        field: this.$t('provider.pricingEndTime')
                    });
                    return this.errorText;
                }
                if (this.parseHHMM(tr.end) <= this.parseHHMM(tr.start)) {
                    this.errorText = this.$t('provider.pricingEndAfterStart', { index });
                    return this.errorText;
                }
                for (let k = i + 1; k < this.timeRanges.length; k++) {
                    if (this.rangesOverlap(tr, this.timeRanges[k])) {
                        this.errorText = this.$t('provider.pricingRangesOverlap', { a: index, b: k + 1 });
                        return this.errorText;
                    }
                }
            }
            return '';
        },
        buildPayload() {
            return {
                time_zone: String(this.timeZone || '').trim(),
                tiers: [
                    {
                        name: PEAK_TIER_NAME,
                        time_ranges: this.timeRanges.map(item => ({
                            weekdays: (item.weekdays || []).slice().sort((a, b) => a - b),
                            start: this.normalizeTime(item.start, '09:00'),
                            end: this.normalizeTime(item.end, '12:00')
                        }))
                    }
                ]
            };
        },
        handleSubmit() {
            const err = this.validate();
            if (err) {
                this.$Message.error(err);
                return;
            }
            this.submitting = true;
            this.$request({
                url: this.$urlFormat('providers/{provider_name}/pricing-tiers', {
                    provider_name: this.providerName
                }),
                method: 'put',
                data: this.buildPayload(),
                openapi: true
            })
                .then(res => {
                    if (res.status === 200) {
                        this.$Message.success(this.$t('provider.pricingTiersUpdated'));
                        this.$emit('submit');
                    } else {
                        this.$Message.error(this.$t('com.tipSubmitFailed'));
                    }
                })
                .catch(err => {
                    console.error('提交分段计价配置失败:', err);
                    this.$Message.error(
                        (err && err.data && err.data.ErrMsg) || this.$t('com.tipSubmitFailed')
                    );
                })
                .finally(() => {
                    this.submitting = false;
                });
        }
    }
};
</script>

<style lang="less" scoped>
.provider-name {
    font-size: 14px;
    color: #17233d;
    line-height: 32px;
}

.tier-code {
    margin-left: 8px;
    color: #808695;
    font-size: 12px;
}

.ranges-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e8eaec;

    th,
    td {
        padding: 10px 8px;
        border: 1px solid #e8eaec;
        vertical-align: top;
        text-align: left;
    }

    th {
        background: #f8f8f9;
        font-weight: 500;
    }

    .time-col {
        width: 140px;
    }
}

.time-input {
    width: 100%;
    height: 32px;
    padding: 0 8px;
    border: 1px solid #dcdee2;
    border-radius: 4px;
    color: #515a6e;
}

.weekday-picker {
    min-width: 360px;
}

.weekday-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
}

.weekday-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;

    /deep/ .ivu-checkbox-wrapper {
        margin-right: 0;
        font-size: 12px;
        line-height: 1;
    }
}

.weekday-quick {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-left: 8px;
    padding-left: 16px;
    border-left: 1px solid #e8eaec;
    color: #808695;
    font-size: 12px;
    white-space: nowrap;
}

.weekday-quick-label {
    color: #808695;
}

.weekday-quick-link {
    padding: 0;
    border: none;
    background: none;
    color: #2d8cf0;
    font-size: 12px;
    cursor: pointer;

    &:hover {
        color: #57a3f3;
        text-decoration: underline;
    }
}

.weekday-quick-sep {
    color: #dcdee2;
    user-select: none;
}

.error-text {
    color: #ed4014;
    margin-top: 8px;
}

.drawer-footer {
    margin-top: 24px;
    text-align: right;
}
</style>
