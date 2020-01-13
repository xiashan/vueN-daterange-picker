<template>
  <transition name="el-zoom-in-top" @after-leave="$emit('dodestroy')">
    <div
      v-show="visible"
      class="el-picker-panel el-date-range-picker el-popper"
      :class="[
        {
          'has-sidebar': $slots.sidebar || shortcuts
        },
        popperClass
      ]"
    >
      <div class="el-picker-panel__body-wrapper">
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
          <div class="el-picker-panel__content el-date-range-picker__content is-left">
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
          <div class="el-picker-panel__content el-date-range-picker__content is-right">
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
import {
  isDateObject,
  prevYear,
  nextYear,
  prevMonth,
  nextMonth,
  nextDate
} from '../util/util';
import DateTable from '../basic/DateTable.vue';

import { MONTHS } from '../util/const';

// 计算defaultValue
const calcDefaultValue = (defaultValue) => {
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

  data() {
    return {
      popperClass: '',
      value: [],
      defaultValue: null,
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
      shortcuts: '',
      shortcutValue: '',
      timezone: '',
      visible: '',
      disabledDate: '',
      cellClassName: '',
      firstDayOfWeek: 1,
      arrowControl: false,
      unlinkPanels: false
    };
  },

  computed: {
    leftLabel() {
      return `${MONTHS[this.leftDate.getMonth()]} ${this.leftDate.getFullYear()}`;
    },

    rightLabel() {
      return `${MONTHS[this.rightDate.getMonth()]} ${this.rightDate.getFullYear()}`;
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
    // 通过value(array)计算minDate,maxDate以及leftDate和rightDate
    value(newVal) {
      if (!newVal) {
        this.minDate = null;
        this.maxDate = null;
      } else if (Array.isArray(newVal)) {
        this.minDate = isDateObject(newVal[0]) ? new Date(newVal[0]) : null;
        this.maxDate = isDateObject(newVal[1]) ? new Date(newVal[1]) : null;
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

    // 通过defaultValue计算leftData和rightDate
    // 但this.value的优先级比较高
    defaultValue(val) {
      if (!Array.isArray(this.value)) {
        const [left, right] = calcDefaultValue(val);
        this.leftDate = left;
        this.rightDate =
          val && val[1] && this.unlinkPanels ? right : nextMonth(this.leftDate);
      }
    }
  },

  methods: {
    handleClear() {
      this.minDate = null;
      this.maxDate = null;
      this.leftDate = calcDefaultValue(this.defaultValue)[0];
      this.rightDate = nextMonth(this.leftDate);
    },

    // 选中一个日期后，移动鼠标
    handleChangeRange(val) {
      this.minDate = val.minDate;
      this.maxDate = val.maxDate;
      this.rangeState = val.rangeState;
    },

    // 选中日期面板中的日期
    // { minDate, maxDate }
    handleRangePick(val, close = true) {
      if (this.maxDate === val.maxDate && this.minDate === val.minDate) {
        return;
      }
      this.maxDate = val.maxDate;
      this.minDate = val.minDate;

      // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57
      setTimeout(() => {
        this.maxDate = val.maxDate;
        this.minDate = val.minDate;
      }, 10);
      if (!close) return;
      this.handleConfirm();
    },

    // 选择左侧的区间
    // 对应的日期放到picker中计算
    handleShortcutClick(shortcut) {
      this.shortcutValue = shortcut.value;
      this.$emit('pick', {
        shortcut: shortcut.value
      });
    },

    // 选择日期区间
    // shortcut放到picker中计算
    handleConfirm(visible = false) {
      if (this.isValidValue([this.minDate, this.maxDate])) {
        // 判断选择的日期有没匹配到区间
        this.$emit('pick', {
          dateRange: [this.minDate, this.maxDate],
        }, visible);
      }
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

    isValidValue(value) {
      return (
        value && Array.isArray(value) &&
        value[0] && isDateObject(value[0]) &&
        value[1] && isDateObject(value[1]) &&
        value[0].getTime() <= value[1].getTime() &&
        (typeof this.disabledDate === 'function'
          ? !this.disabledDate(value[0]) && !this.disabledDate(value[1])
          : true)
      );
    },

    resetView() {
      // NOTE: this is a hack to reset {min, max}Date on picker open.
      // TODO: correct way of doing so is to refactor {min, max}Date to be dependent on value and internal selection state
      // an alternative would be resetView whenever picker becomes visible, should also investigate date-panel's resetView
      if (this.minDate && this.maxDate == null) {
        this.rangeState.selecting = false;
      }
      this.minDate =
        this.value && isDateObject(this.value[0]) ? new Date(this.value[0]) : null;
      this.maxDate =
        this.value && isDateObject(this.value[0]) ? new Date(this.value[1]) : null;
    }
  }
};
</script>

<style scoped>
.el-date-range-picker.has-sidebar {
  width: 806px;
  z-index: 100;
}
.el-picker-panel__sidebar {
  width: 160px;
  padding: 8px;
}
.el-picker-panel__sidebar > div {
  margin-bottom: 8px;
}
.el-picker-panel__sidebar + .el-picker-panel__body {
  margin-left: 160px;
}
</style>
