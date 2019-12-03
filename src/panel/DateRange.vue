<template>
  <transition name="el-zoom-in-top" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[
        {
          'has-sidebar': $slots.sidebar || shortcuts,
          'has-time': showTime
        },
        popperClass
      ]"
    >
      <div class="el-picker-panel__body-wrapper">
        <slot name="sidebar" class="el-picker-panel__sidebar"></slot>
        <div v-if="shortcuts" class="el-picker-panel__sidebar">
          <div v-for="(shortcut, key) in shortcuts" :key="key">
            <button
              type="button"
              class="el-button is-plain el-button--medium el-picker-panel__shortcut"
              :class="{ 'el-button--primary is-disabled': shortcut.value == shortcutValue }"
              :disabled="shortcut.value == shortcutValue"
              @click="handleShortcutClick(shortcut)"
            >
              {{ shortcut.text }}
            </button>
          </div>
        </div>
        <div class="el-picker-panel__body">
          <div
            class="el-picker-panel__content el-date-range-picker__content is-left"
          >
            <div class="el-date-range-picker__header">
              <button
                type="button"
                class="el-picker-panel__icon-btn el-icon-d-arrow-left"
                @click="leftPrevYear"
              ></button>
              <button
                type="button"
                class="el-picker-panel__icon-btn el-icon-arrow-left"
                @click="leftPrevMonth"
              ></button>
              <button
                v-if="unlinkPanels"
                type="button"
                :disabled="!enableYearArrow"
                :class="{ 'is-disabled': !enableYearArrow }"
                class="el-picker-panel__icon-btn el-icon-d-arrow-right"
                @click="leftNextYear"
              ></button>
              <button
                v-if="unlinkPanels"
                type="button"
                :disabled="!enableMonthArrow"
                :class="{ 'is-disabled': !enableMonthArrow }"
                class="el-picker-panel__icon-btn el-icon-arrow-right"
                @click="leftNextMonth"
              ></button>
              <div>{{ leftLabel }}</div>
            </div>
            <date-table
              selection-mode="range"
              :date="leftDate"
              :default-value="defaultValue"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :disabled-date="disabledDate"
              :cell-class-name="cellClassName"
              :first-day-of-week="firstDayOfWeek"
              @changerange="handleChangeRange"
              @pick="handleRangePick"
            >
            </date-table>
          </div>
          <div
            class="el-picker-panel__content el-date-range-picker__content is-right"
          >
            <div class="el-date-range-picker__header">
              <button
                v-if="unlinkPanels"
                type="button"
                :disabled="!enableYearArrow"
                :class="{ 'is-disabled': !enableYearArrow }"
                class="el-picker-panel__icon-btn el-icon-d-arrow-left"
                @click="rightPrevYear"
              ></button>
              <button
                v-if="unlinkPanels"
                type="button"
                :disabled="!enableMonthArrow"
                :class="{ 'is-disabled': !enableMonthArrow }"
                class="el-picker-panel__icon-btn el-icon-arrow-left"
                @click="rightPrevMonth"
              ></button>
              <button
                type="button"
                class="el-picker-panel__icon-btn el-icon-d-arrow-right"
                @click="rightNextYear"
              ></button>
              <button
                type="button"
                class="el-picker-panel__icon-btn el-icon-arrow-right"
                @click="rightNextMonth"
              ></button>
              <div>{{ rightLabel }}</div>
            </div>
            <date-table
              selection-mode="range"
              :date="rightDate"
              :default-value="defaultValue"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :disabled-date="disabledDate"
              :cell-class-name="cellClassName"
              :first-day-of-week="firstDayOfWeek"
              @changerange="handleChangeRange"
              @pick="handleRangePick"
            >
            </date-table>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
import Clickoutside from '../util/clickoutside';
import {
  formatDate,
  parseDate,
  isDate,//
  modifyDate,
  modifyWithTimeString,
  prevYear,
  nextYear,
  prevMonth,
  nextMonth,
  nextDate,//
  extractDateFormat
} from '../util/util';
import DateTable from '../basic/DateTable.vue';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'Septempber', 'October', 'November', 'December'];

const calcDefaultValue = defaultValue => {
  if (Array.isArray(defaultValue)) {
    return [new Date(defaultValue[0]), new Date(defaultValue[1])];
  } else if (defaultValue) {
    return [new Date(defaultValue), nextDate(new Date(defaultValue), 1)];
  } else {
    return [new Date(), nextDate(new Date(), 1)];
  }
};

export default {
  components: { DateTable },

  directives: { Clickoutside },

  data() {
    return {
      popperClass: '',
      value: [],
      defaultValue: null,
      defaultTime: null,
      minDate: '',
      maxDate: '',
      leftDate: new Date(),
      rightDate: nextMonth(new Date()),
      rangeState: {
        endDate: null,
        selecting: false,
        row: null,
        column: null
      },
      showTime: false,
      shortcuts: '',
      shortcutValue: '',
      timezone: '',
      visible: '',
      disabledDate: '',
      cellClassName: '',
      firstDayOfWeek: 1,
      minTimePickerVisible: false,
      maxTimePickerVisible: false,
      format: '',
      arrowControl: false,
      unlinkPanels: false,
      dateUserInput: {
        min: null,
        max: null
      },
      timeUserInput: {
        min: null,
        max: null
      }
    };
  },

  computed: {
    btnDisabled() {
      return !(
        this.minDate &&
        this.maxDate &&
        !this.selecting &&
        this.isValidValue([this.minDate, this.maxDate])
      );
    },

    leftLabel() {
      return (
        MONTHS[this.leftDate.getMonth()] + ' ' +
        this.leftDate.getFullYear()
      );
    },

    rightLabel() {
      return (
        MONTHS[this.rightDate.getMonth()] + ' ' +
        this.rightDate.getFullYear()
      );
    },

    leftYear() {
      return this.leftDate.getFullYear();
    },

    leftMonth() {
      return this.leftDate.getMonth();
    },

    leftMonthDate() {
      return this.leftDate.getDate();
    },

    rightYear() {
      return this.rightDate.getFullYear();
    },

    rightMonth() {
      return this.rightDate.getMonth();
    },

    rightMonthDate() {
      return this.rightDate.getDate();
    },

    minVisibleDate() {
      if (this.dateUserInput.min !== null) return this.dateUserInput.min;
      if (this.minDate) return formatDate(this.minDate, this.dateFormat);
      return '';
    },

    maxVisibleDate() {
      if (this.dateUserInput.max !== null) return this.dateUserInput.max;
      if (this.maxDate || this.minDate)
        return formatDate(this.maxDate || this.minDate, this.dateFormat);
      return '';
    },

    dateFormat() {
      if (this.format) {
        return extractDateFormat(this.format);
      } else {
        return 'yyyy-MM-dd';
      }
    },

    enableMonthArrow() {
      const nextMonth = (this.leftMonth + 1) % 12;
      const yearOffset = this.leftMonth + 1 >= 12 ? 1 : 0;
      return (
        this.unlinkPanels &&
        new Date(this.leftYear + yearOffset, nextMonth) <
          new Date(this.rightYear, this.rightMonth)
      );
    },

    enableYearArrow() {
      return (
        this.unlinkPanels &&
        this.rightYear * 12 +
          this.rightMonth -
          (this.leftYear * 12 + this.leftMonth + 1) >=
          12
      );
    }
  },

  watch: {
    minDate(val) {
      this.dateUserInput.min = null;
      this.timeUserInput.min = null;
      this.$nextTick(() => {
        if (
          this.$refs.maxTimePicker &&
          this.maxDate &&
          this.maxDate < this.minDate
        ) {
          const format = 'HH:mm:ss';
          this.$refs.maxTimePicker.selectableRange = [
            [
              parseDate(formatDate(this.minDate, format), format),
              parseDate('23:59:59', format)
            ]
          ];
        }
      });
      if (val && this.$refs.minTimePicker) {
        this.$refs.minTimePicker.date = val;
        this.$refs.minTimePicker.value = val;
      }
    },

    maxDate(val) {
      this.dateUserInput.max = null;
      this.timeUserInput.max = null;
      if (val && this.$refs.maxTimePicker) {
        this.$refs.maxTimePicker.date = val;
        this.$refs.maxTimePicker.value = val;
      }
    },

    value(newVal) {
      if (!newVal) {
        this.minDate = null;
        this.maxDate = null;
      } else if (Array.isArray(newVal)) {
        this.minDate = isDate(newVal[0]) ? new Date(newVal[0]) : null;
        this.maxDate = isDate(newVal[1]) ? new Date(newVal[1]) : null;
        if (this.minDate) {
          this.leftDate = this.minDate;
          if (this.unlinkPanels && this.maxDate) {
            const minDateYear = this.minDate.getFullYear();
            const minDateMonth = this.minDate.getMonth();
            const maxDateYear = this.maxDate.getFullYear();
            const maxDateMonth = this.maxDate.getMonth();
            this.rightDate =
              minDateYear === maxDateYear && minDateMonth === maxDateMonth
                ? nextMonth(this.maxDate)
                : this.maxDate;
          } else {
            this.rightDate = nextMonth(this.leftDate);
          }
        } else {
          this.leftDate = calcDefaultValue(this.defaultValue)[0];
          this.rightDate = nextMonth(this.leftDate);
        }
      }
    },

    defaultValue(val) {
      if (!Array.isArray(this.value)) {
        const [left, right] = calcDefaultValue(val);
        this.leftDate = left;
        this.rightDate =
          val && val[1] && this.unlinkPanels ? right : nextMonth(this.leftDate);
      }
    },

    // shortcuts赋值的时候，自动计算开始时间和结束时间
    // TODO 跨天的时候会有一定误差
    shortcuts(val) {
      if (Array.isArray(val)) {
        // 根据timezone调整today的日期, 默认获取的today是+8时区的时间
        let today = new Date();
        if (this.timezone) {
          const gap = parseInt(this.timezone.split(':')[0], 10);
          today = new Date(today.getTime() - (gap > 0 ? gap - 8 : 8 - gap) * 60 * 60 * 1000);
        }
        // 方便比较开始时间和结束时间
        const t = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const d = today.getDay();
        val.forEach(item => {
          switch (item.value) {
            case '0d':
              item.start = t;
              item.end = t;
              break;
            case '-1d':
              item.start = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - 1
              );
              item.end = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - 1
              );
              break;
            case '-7d':
              item.start = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - 7
              );
              item.end = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - 1
              );
              break;
            case '-1w':
              item.start = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - 6 - d
              );
              item.end = new Date(
                t.getFullYear(),
                t.getMonth(),
                t.getDate() - d
              );
              break;
            case '0m':
              item.start = new Date(t.getFullYear(), t.getMonth(), 1);
              item.end = t;
              break;
            case '-1m':
              item.start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
              item.end = new Date(t.getFullYear(), t.getMonth(), 0);
              break;
          }
        });
      }
    }
  },

  methods: {
    handleClear() {
      this.minDate = null;
      this.maxDate = null;
      this.leftDate = calcDefaultValue(this.defaultValue)[0];
      this.rightDate = nextMonth(this.leftDate);
      this.$emit('pick', null);
    },

    handleChangeRange(val) {
      this.minDate = val.minDate;
      this.maxDate = val.maxDate;
      this.rangeState = val.rangeState;
    },

    handleDateInput(value, type) {
      this.dateUserInput[type] = value;
      if (value.length !== this.dateFormat.length) return;
      const parsedValue = parseDate(value, this.dateFormat);

      if (parsedValue) {
        if (
          typeof this.disabledDate === 'function' &&
          this.disabledDate(new Date(parsedValue))
        ) {
          return;
        }
        if (type === 'min') {
          this.minDate = modifyDate(
            this.minDate || new Date(),
            parsedValue.getFullYear(),
            parsedValue.getMonth(),
            parsedValue.getDate()
          );
          this.leftDate = new Date(parsedValue);
          if (!this.unlinkPanels) {
            this.rightDate = nextMonth(this.leftDate);
          }
        } else {
          this.maxDate = modifyDate(
            this.maxDate || new Date(),
            parsedValue.getFullYear(),
            parsedValue.getMonth(),
            parsedValue.getDate()
          );
          this.rightDate = new Date(parsedValue);
          if (!this.unlinkPanels) {
            this.leftDate = prevMonth(parsedValue);
          }
        }
      }
    },

    handleDateChange(value, type) {
      const parsedValue = parseDate(value, this.dateFormat);
      if (parsedValue) {
        if (type === 'min') {
          this.minDate = modifyDate(
            this.minDate,
            parsedValue.getFullYear(),
            parsedValue.getMonth(),
            parsedValue.getDate()
          );
          if (this.minDate > this.maxDate) {
            this.maxDate = this.minDate;
          }
        } else {
          this.maxDate = modifyDate(
            this.maxDate,
            parsedValue.getFullYear(),
            parsedValue.getMonth(),
            parsedValue.getDate()
          );
          if (this.maxDate < this.minDate) {
            this.minDate = this.maxDate;
          }
        }
      }
    },

    handleRangePick(val, close = true) {
      const defaultTime = this.defaultTime || [];
      const minDate = modifyWithTimeString(val.minDate, defaultTime[0]);
      const maxDate = modifyWithTimeString(val.maxDate, defaultTime[1]);

      if (this.maxDate === maxDate && this.minDate === minDate) {
        return;
      }
      this.onPick && this.onPick(val);
      this.maxDate = maxDate;
      this.minDate = minDate;

      // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57
      setTimeout(() => {
        this.maxDate = maxDate;
        this.minDate = minDate;
      }, 10);
      if (!close || this.showTime) return;
      this.handleConfirm();
    },

    handleShortcutClick(shortcut) {
      this.shortcutValue = shortcut.value;
      this.$emit('pick', [shortcut.start, shortcut.end]);
      this.$emit('changeshortcut', shortcut);
    },

    // leftPrev*, rightNext* need to take care of `unlinkPanels`
    leftPrevYear() {
      this.leftDate = prevYear(this.leftDate);
      if (!this.unlinkPanels) {
        this.rightDate = nextMonth(this.leftDate);
      }
    },

    leftPrevMonth() {
      this.leftDate = prevMonth(this.leftDate);
      if (!this.unlinkPanels) {
        this.rightDate = nextMonth(this.leftDate);
      }
    },

    rightNextYear() {
      if (!this.unlinkPanels) {
        this.leftDate = nextYear(this.leftDate);
        this.rightDate = nextMonth(this.leftDate);
      } else {
        this.rightDate = nextYear(this.rightDate);
      }
    },

    rightNextMonth() {
      if (!this.unlinkPanels) {
        this.leftDate = nextMonth(this.leftDate);
        this.rightDate = nextMonth(this.leftDate);
      } else {
        this.rightDate = nextMonth(this.rightDate);
      }
    },

    // leftNext*, rightPrev* are called when `unlinkPanels` is true
    leftNextYear() {
      this.leftDate = nextYear(this.leftDate);
    },

    leftNextMonth() {
      this.leftDate = nextMonth(this.leftDate);
    },

    rightPrevYear() {
      this.rightDate = prevYear(this.rightDate);
    },

    rightPrevMonth() {
      this.rightDate = prevMonth(this.rightDate);
    },

    handleConfirm(visible = false) {
      if (this.isValidValue([this.minDate, this.maxDate])) {
        this.$emit('pick', [this.minDate, this.maxDate], visible);
      }
    },

    isValidValue(value) {
      return (
        Array.isArray(value) &&
        value &&
        value[0] &&
        value[1] &&
        isDate(value[0]) &&
        isDate(value[1]) &&
        value[0].getTime() <= value[1].getTime() &&
        (typeof this.disabledDate === 'function'
          ? !this.disabledDate(value[0]) && !this.disabledDate(value[1])
          : true)
      );
    },

    resetView() {
      // NOTE: this is a hack to reset {min, max}Date on picker open.
      // TODO: correct way of doing so is to refactor {min, max}Date to be dependent on value and internal selection state
      //       an alternative would be resetView whenever picker becomes visible, should also investigate date-panel's resetView
      if (this.minDate && this.maxDate == null)
        this.rangeState.selecting = false;
      this.minDate =
        this.value && isDate(this.value[0]) ? new Date(this.value[0]) : null;
      this.maxDate =
        this.value && isDate(this.value[0]) ? new Date(this.value[1]) : null;
    }
  }
};
</script>

<style scoped>
.el-date-range-picker.has-sidebar {
  width: 806px;
}
.el-picker-panel [slot='sidebar'],
.el-picker-panel__sidebar {
  width: 160px;
  padding: 8px;
}
.el-picker-panel [slot='sidebar'],
.el-picker-panel__sidebar > div {
  margin-bottom: 8px;
}
.el-picker-panel [slot='sidebar'] + .el-picker-panel__body,
.el-picker-panel__sidebar + .el-picker-panel__body {
  margin-left: 160px;
}
</style>
