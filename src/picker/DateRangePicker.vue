<template>
  <div
    class="el-date-editor el-range-editor el-input__inner el-date-editor--daterange"
    :class="[
      pickerSize ? `el-range-editor--${ pickerSize }` : '',
      pickerDisabled ? 'is-disabled' : '',
      pickerVisible ? 'is-active' : ''
    ]"
    @click="handleRangeClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @keydown="handleKeydown"
    ref="reference"
    v-clickoutside="handleClose">
    <i class="el-input__icon el-range__icon el-icon-date"></i>
    <input
      autocomplete="off"
      :placeholder="startPlaceholder"
      :value="displayValue && displayValue[0]"
      :disabled="pickerDisabled"
      :readonly="!editable || readonly"
      :name="name && name[0]"
      @input="handleStartInput"
      @change="handleStartChange"
      @focus="handleFocus"
      class="el-range-input">
    <slot name="range-separator">
      <span class="el-range-separator">{{ rangeSeparator }}</span>
    </slot>
    <input
      autocomplete="off"
      :placeholder="endPlaceholder"
      :value="displayValue && displayValue[1]"
      :disabled="pickerDisabled"
      :readonly="!editable || readonly"
      :name="name && name[1]"
      @input="handleEndInput"
      @change="handleEndChange"
      @focus="handleFocus"
      class="el-range-input">
    <i
      @click="handleClickIcon"
      :class="[showClose ? '' + clearIcon : '']"
      class="el-input__icon el-range__close-icon">
    </i>
  </div>
</template>

<script>
import Vue from 'vue';
import DateRangePanel from '../panel/DateRange.vue';
import Clickoutside from '../util/clickoutside';
import Popper from 'vuen-popper';
import {
  formatDate,
  parseDate,
  isDateObject,
  merge,
  valueEquals,
  clearTime,
  validator
} from '../util/util';

import {
  PLACEMENT_MAP,
  PICKER_OPTIONS,
  DEFAULT_FORMATS
} from '../util/const';

const NewPopper = {
  props: {
    appendToBody: Popper.props.appendToBody,
    visibleArrow: Popper.props.visibleArrow
  },
  methods: Popper.methods,
  data() {
    return merge({ popperOptions: { placement: 'bottom' } }, Popper.data);
  },
  beforeDestroy: Popper.beforeDestroy
};

// 标准时间转化成字符串
const DATE_FORMATTER = (value, format) => {
  if (format === 'timestamp') {
    return value.getTime();
  }
  return formatDate(value, format);
};

// 字符串转化成标准时间
const DATE_PARSER = (text, format) => {
  if (format === 'timestamp') {
    return new Date(Number(text));
  }
  return parseDate(text, format);
};

const RANGE_FORMATTER = (value, format) => {
  if (Array.isArray(value) && value.length === 2) {
    const start = value[0];
    const end = value[1];

    if (start && end) {
      return [DATE_FORMATTER(start, format), DATE_FORMATTER(end, format)];
    }
  }
  return '';
};

const RANGE_PARSER = (array, format, separator) => {
  if (!Array.isArray(array)) {
    array = array.split(separator);
  }
  if (array.length === 2) {
    const range1 = array[0];
    const range2 = array[1];

    return [DATE_PARSER(range1, format), DATE_PARSER(range2, format)];
  }
  return [];
};

// 支持单个date和range两种形式的parse
const parseAsFormatAndType = (value, customFormat, type, rangeSeparator = '/') => {
  if (!value) return null;
  const format = customFormat || DEFAULT_FORMATS[type];
  // 单独修改startDate或endDate
  if (type === 'date') {
    return DATE_PARSER(value, format);
  }
  return RANGE_PARSER(value, format, rangeSeparator);
};

// 支持单个date和range两种形式的format
const formatAsFormatAndType = (value, customFormat, type) => {
  if (!value) return null;
  const format = customFormat || DEFAULT_FORMATS[type];
  if (type === 'date') {
    return DATE_FORMATTER(value, format);
  }
  return RANGE_FORMATTER(value, format);
};

export default {
  mixins: [NewPopper],

  directives: { Clickoutside },

  inject: {
    elForm: { default: '' },
    elFormItem: { default: '' }
  },

  props: {
    name: {
      default: '',
      validator
    },
    value: {},
    defaultValue: {}, // 透传给picker，决定panel面板的日期
    size: String,
    format: { // 页面展示的格式
      type: String,
      default: 'yyyy-MM-dd'
    },
    valueFormat: { // 给定参数(一般是string)的格式
      type: String,
      default: 'yyyy-MM-dd'
    },
    readonly: Boolean, // 日期选择只读
    disabled: Boolean, // 日期选择禁止操作
    startPlaceholder: String,
    endPlaceholder: String,
    clearable: {
      type: Boolean,
      default: false
    },
    clearIcon: {
      type: String,
      default: 'el-icon-circle-close'
    },
    editable: { // input是否可以直接修改来修改日期
      type: Boolean,
      default: true
    },
    popperClass: String,
    align: {
      type: String,
      default: 'left'
    },
    rangeSeparator: {
      default: '/'
    },
    pickerOptions: {},
    timezone: String,
    unlinkPanels: Boolean
  },

  data() {
    return {
      type: 'daterange',
      pickerVisible: false,
      showClose: false, // 显示clear图标
      userInput: null, // input框的用户输入
      valueOnOpen: null, // picker重新选择前的值，用来决定是否emit change事件, string
      unwatchTimezone: null,
      openValue: this.value,
    };
  },

  watch: {
    pickerVisible(val) {
      if (this.readonly || this.pickerDisabled) return;
      if (val) {
        this.showPicker();
        this.valueOnOpen = Array.isArray(this.dateValue)
          ? [...this.dateValue]
          : this.dateValue;
      } else {
        this.hidePicker();
        this.emitChange({ dateRange: this.dateValue, shortcut: this.shortcutValue });
        this.userInput = null;
        this.blur();
        this.$emit('blur', this);
      }
    },
    defaultValue(val) {
      // NOTE: should eventually move to jsx style picker + panel ?
      if (this.picker) {
        this.picker.defaultValue = val;
      }
    },
    value(val) {
      this.openValue = val;
    }
  },

  computed: {
    ranged() {
      return this.type.indexOf('range') > -1;
    },

    // 日期选择的值，array, 符合valueFormat的类型（默认yyyy-MM-dd的字符串）
    dateValue() {
      if (!this.openValue) {
        return '';
      }
      // 如果shortcut存在，那么根据shortcut计算dateRange
      if (this.openValue.shortcut) {
        return this.formatToValue(this.getDateRangeByShortcut(this.openValue.shortcut));
      } else {
        return this.openValue.dateRange;
      }
    },

    // 快捷选择的值，string
    shortcutValue() {
      if (!this.openValue) {
        return '';
      }
      // 如果dateRange存在，那么根据dateRange计算shortcut
      if (this.openValue.shortcut) {
        return this.openValue.shortcut;
      } else if (Array.isArray(this.openValue.dateRange) && this.openValue.dateRange.length === 2) {
        return this.getShortcutByRange(this.openValue.dateRange);
      } else {
        return '';
      }
    },

    reference() {
      const reference = this.$refs.reference;
      return reference.$el || reference;
    },

    refInput() {
      if (this.reference) {
        return [].slice.call(this.reference.querySelectorAll('input'));
      }
      return [];
    },

    // 日期选择是否为空
    valueIsEmpty() {
      const val = this.dateValue;
      if (Array.isArray(val)) {
        return !val.some(item => item);
      } else if (val) {
        return false;
      }
      return true;
    },

    selectionMode() {
      return 'day';
    },

    // 将传递的日期解析成日期数据类型
    parsedValue() {
      if (!this.dateValue) {
        return this.dateValue; // component value is not set
      }

      // 已经是日期类型，直接返回
      const valueIsDateObject = isDateObject(this.dateValue)
        || (Array.isArray(this.dateValue) && this.dateValue.every(isDateObject));
      if (valueIsDateObject) {
        return this.dateValue;
      }

      if (this.valueFormat) {
        return parseAsFormatAndType(this.dateValue, this.valueFormat, this.type, this.rangeSeparator)
          || this.dateValue;
      }

      // 将绑定的数据转化成日期格式,采用默认格式'yyyy-MM-dd'
      return Array.isArray(this.dateValue)
        ? this.dateValue.map(val => DATE_PARSER(val))
        : DATE_PARSER(this.dateValue);
    },

    // 页面显示的值
    displayValue() {
      const formattedValue = formatAsFormatAndType(this.parsedValue, this.format, this.type);
      if (Array.isArray(this.userInput)) {
        return [
          this.userInput[0] || (formattedValue && formattedValue[0]) || '',
          this.userInput[1] || (formattedValue && formattedValue[1]) || ''
        ];
      } else if (this.userInput !== null) {
        return this.userInput;
      } else if (formattedValue) {
        return formattedValue;
      } else {
        return '';
      }
    },

    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize;
    },

    pickerSize() {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
    },

    pickerDisabled() {
      return this.disabled || (this.elForm || {}).disabled;
    },

    options() {
      // 将传入的pickerOptions参数跟PICKER_OPTIONS合并
      if (!this.pickerOptions) {
        return PICKER_OPTIONS;
      }
      return { ...PICKER_OPTIONS, ...this.pickerOptions };
    }
  },

  created() {
    this.panel = DateRangePanel;

    // vue-popper
    this.popperOptions = {
      boundariesPadding: 0,
      gpuAcceleration: false
    };
    this.placement = PLACEMENT_MAP[this.align] || PLACEMENT_MAP.left;

    this.$on('fieldReset', this.handleFieldReset);
  },

  methods: {
    focus() {
      if (!this.ranged) {
        this.$refs.reference.focus();
      } else {
        this.handleFocus();
      }
    },

    // 两个日期框都失去焦点
    blur() {
      this.refInput.forEach(input => input.blur());
    },

    handleFocus() {
      this.handleRangeClick();
    },

    // 日期类型转化成格式化的字符串
    formatToValue(date) {
      const isFormattable = isDateObject(date)
        || (Array.isArray(date) && date.every(isDateObject));
      if (this.valueFormat && isFormattable) {
        return formatAsFormatAndType(date, this.valueFormat, this.type);
      } else {
        return date;
      }
    },

    // 用户输入字符串转化成日期类型(input直接输入type=date)
    parseString(value) {
      const type = Array.isArray(value) ? this.type : this.type.replace('range', '');
      return parseAsFormatAndType(value, this.format, type);
    },

    // 用户输入的转化后的日期类型再格式化(input直接输入type=date)
    formatToString(value) {
      const type = Array.isArray(value) ? this.type : this.type.replace('range', '');
      return formatAsFormatAndType(value, this.format, type);
    },

    // 出现日期选择弹窗
    handleRangeClick() {
      if (!this.pickerVisible) {
        this.pickerVisible = true;
      }
      this.$emit('focus', this);
    },

    handleMouseEnter() {
      if (this.readonly || this.pickerDisabled) return;
      if (!this.valueIsEmpty && this.clearable) {
        this.showClose = true;
      }
    },

    handleMouseLeave() {
      this.showClose = false;
    },

    handleKeydown(event) {
      const keyCode = event.keyCode;

      // ESC, 关闭弹窗
      if (keyCode === 27) {
        this.pickerVisible = false;
        event.stopPropagation();
        return;
      }

      // Tab, 如果焦点在第一个input，则切换焦点到第二个input
      if (keyCode === 9) {
        // user may change focus between two input
        setTimeout(() => {
          if (this.refInput.indexOf(document.activeElement) === -1) {
            this.pickerVisible = false;
            this.blur();
            event.stopPropagation();
          }
        }, 0);
        return;
      }

      // Enter
      if (keyCode === 13) {
        if (this.isValidValue(this.parseString(this.displayValue))) {
          // 如果input的值有改变，会在handleStartChange等函数中处理,所以这里直接关闭弹窗即可
          this.pickerVisible = this.picker.visible = false;
          this.blur();
        }
        event.stopPropagation();
        return;
      }

      // if user is typing, do not let picker handle key input
      if (this.userInput) {
        event.stopPropagation();
        return;
      }

      // delegate other keys to panel
      if (this.picker && this.picker.handleKeydown) {
        this.picker.handleKeydown(event);
      }
    },

    // 手动输入或改变开始日期
    handleStartInput(event) {
      if (this.userInput) {
        this.userInput = [event.target.value, this.userInput[1]];
      } else {
        this.userInput = [event.target.value, null];
      }
    },

    // 手动输入或改变结束日期
    handleEndInput(event) {
      if (this.userInput) {
        this.userInput = [this.userInput[0], event.target.value];
      } else {
        this.userInput = [null, event.target.value];
      }
    },

    // 开始日期失去焦点，值改变
    handleStartChange(event) {
      const value = this.parseString(this.userInput && this.userInput[0]);
      if (value) {
        this.userInput = [this.formatToString(value), this.displayValue[1]];
        const newValue = [value, this.picker.value && this.picker.value[1]];
        this.picker.value = newValue;
        if (this.isValidValue(newValue)) {
          this.emitInput({ dateRange: newValue });
          this.userInput = null;
        }
      }
    },

    // 结束日期失去焦点，值改变
    handleEndChange(event) {
      const value = this.parseString(this.userInput && this.userInput[1]);
      if (value) {
        this.userInput = [this.displayValue[0], this.formatToString(value)];
        const newValue = [this.picker.value && this.picker.value[0], value];
        this.picker.value = newValue;
        if (this.isValidValue(newValue)) {
          this.emitInput({ dateRange: newValue });
          this.userInput = null;
        }
      }
    },

    // 清除选择的日期
    handleClickIcon(event) {
      if (this.readonly || this.pickerDisabled) return;
      if (this.showClose) {
        this.valueOnOpen = this.dateValue;
        event.stopPropagation();
        this.emitInput(null);
        this.emitChange(null);
        this.showClose = false;
        if (this.picker && typeof this.picker.handleClear === 'function') {
          this.picker.handleClear();
        }
      } else {
        this.pickerVisible = !this.pickerVisible;
      }
    },

    // 关闭日期选择弹窗
    handleClose() {
      if (!this.pickerVisible) return;
      this.pickerVisible = false;
    },

    handleFieldReset(initialValue) {
      this.userInput = initialValue === '' ? null : initialValue;
    },

    hidePicker() {
      if (this.picker) {
        this.picker.resetView && this.picker.resetView();
        this.pickerVisible = this.picker.visible = false;
        this.destroyPopper();
      }
    },

    showPicker() {
      if (!this.picker) {
        this.mountPicker();
      }
      this.pickerVisible = this.picker.visible = true;

      this.updatePopper();

      // 将格式化后的日期格式赋值给picker的value
      this.picker.value = this.parsedValue;
      this.picker.shortcutValue = this.shortcutValue;
      this.picker.resetView && this.picker.resetView();

      this.$nextTick(() => {
        this.picker.adjustSpinners && this.picker.adjustSpinners();
      });
    },

    mountPicker() {
      this.picker = new Vue(this.panel).$mount();
      this.popperElm = this.picker.$el;
      this.picker.width = this.reference.getBoundingClientRect().width;
      this.picker.defaultValue = this.defaultValue;
      this.picker.popperClass = this.popperClass;
      this.picker.showTime = false;
      this.picker.selectionMode = this.selectionMode;
      this.picker.unlinkPanels = this.unlinkPanels;
      this.picker.arrowControl = this.arrowControl || false;
      this.picker.format = this.format;

      // pickerOptions一般不会改变，如果改变，则需要增加watch
      for (const option in this.options) {
        if (this.options.hasOwnProperty(option)) {
          this.picker[option] = this.options[option];
        }
      }

      // watch timezone的改变
      const updateTimezone = () => {
        if (this.timezone) {
          this.picker.timezone = this.timezone;
        }
      };
      updateTimezone();
      this.unwatchTimezone = this.$watch(
        'timezone',
        () => updateTimezone()
      );

      this.$el.appendChild(this.picker.$el);
      this.picker.resetView && this.picker.resetView();

      this.picker.$on('dodestroy', this.doDestroy);
      this.picker.$on('pick', (date = '', visible = false) => {
        this.userInput = null;
        this.pickerVisible = this.picker.visible = visible;
        this.picker.resetView && this.picker.resetView();
        this.emitInput(date);
      });
    },

    unmountPicker() {
      if (this.picker) {
        this.picker.$destroy();
        this.picker.$off();
        if (typeof this.unwatchTimezone === 'function') {
          this.unwatchTimezone();
        }
        this.picker.$el.parentNode.removeChild(this.picker.$el);
      }
    },

    // 决定控件真实的改变
    // val { dateRange, shortcut }
    emitChange(val) {
      if (!val || !valueEquals(this.valueOnOpen, val.dateRange)) {
        this.$emit('change', val);
        this.valueOnOpen = val && val.dateRange ? val.dateRange : val;
      }
    },

    // 修改model的值，dateRange和shortcut只有其一
    // 因此外部不可以直接watch v-model,需要监听change函数
    // val { dateRange, shortcut }
    emitInput(val) {
      if (
        !val // val=null也需要通知到model
          ||
        ( // 有改变
          (val.shortcut && !(val.shortcut === this.shortcutValue))
            ||
          (
            val.dateRange
            && (val.dateRange = this.formatToValue(val.dateRange))
            && !valueEquals(val.dateRange, this.dateValue))
        )
      ) {
        this.$emit('input', val);
        this.openValue = val;
      }
    },

    isValidValue(value) {
      if (!this.picker) {
        this.mountPicker();
      }
      if (this.picker.isValidValue) {
        return value && this.picker.isValidValue(value);
      } else {
        return true;
      }
    },

    getShortcutByRange(date) {
      let shortcut = '';
      const shortcuts = this.options.shortcuts;
      if (Array.isArray(shortcuts) && shortcuts.length > 0) {
        for (let i = 0, len = shortcuts.length; i < len; i++) {
          const res = formatAsFormatAndType(
            this.getDateRangeByShortcut(shortcuts[i].value),
            this.valueFormat
          );
          if (valueEquals(date[0], res[0]) && valueEquals(date[1], res[1])) {
            shortcut = shortcuts[i].value;
            break;
          }
        }
      }
      return shortcut;
    },

    getDateRangeByShortcut(shortcut) {
      let today = new Date();
      if (this.timezone) {
        const gap = parseInt(this.timezone.split(':')[0], 10);
        today = new Date(today.getTime() - (gap > 0 ? gap - 8 : 8 - gap) * 60 * 60 * 1000);
      }
      today = clearTime(today);
      const day = today.getDay();
      let result = [];
      switch (shortcut) {
        case '0d':
          result = [today, today];
          break;
        case '-1d':
        result = [
          new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
          new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
        ];
          break;
        case '-7d':
          result = [
            new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
            new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
          ];
          break;
        case '-1w':
          result = [
            new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 - day),
            new Date(today.getFullYear(), today.getMonth(), today.getDate() - day)
          ];
          break;
        case '0m':
          result = [
            new Date(today.getFullYear(), today.getMonth(), 1),
            today
          ];
          break;
        case '-1m':
          result = [
            new Date(today.getFullYear(), today.getMonth() - 1, 1),
            new Date(today.getFullYear(), today.getMonth(), 0)
          ];
          break;
      }
      return result;
    }
  }
};
</script>
