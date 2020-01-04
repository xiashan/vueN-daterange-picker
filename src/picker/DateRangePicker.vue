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
      v-bind="firstInputId"
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
      v-bind="secondInputId"
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
  validator
} from '../util/util';

import {
  PLACEMENT_MAP,
  PICKER_OPTIONS,
  DEFAULT_FORMATS
} from '../util/const';

// TODO require
import 'element-ui/lib/theme-chalk/index.css'

const NewPopper = {
  props: {
    appendToBody: Popper.props.appendToBody,
    offset: Popper.props.offset,
    boundariesPadding: Popper.props.boundariesPadding,
    arrowOffset: Popper.props.arrowOffset
  },
  methods: Popper.methods,
  data() {
    return merge({ visibleArrow: true }, Popper.data);
  },
  beforeDestroy: Popper.beforeDestroy
};

const DATE_FORMATTER = (value, format) => {
  if (format === 'timestamp') {
    return value.getTime();
  }
  return formatDate(value, format);
};

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

const parseAsFormatAndType = (value, customFormat, type, rangeSeparator = '/') => {
  if (!value) return null;
  const format = customFormat || DEFAULT_FORMATS[type];
  // 单独修改startDate或endDate
  if (type === 'date') {
    return DATE_PARSER(value, format, rangeSeparator);
  }
  return RANGE_PARSER(value, format, rangeSeparator);
};

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
    id: {
      default: '',
      validator
    },
    name: {
      default: '',
      validator
    },
    value: {},
    defaultValue: {},
    size: String,
    format: String,
    valueFormat: String,
    readonly: Boolean,
    disabled: Boolean,
    placeholder: String,
    startPlaceholder: String,
    endPlaceholder: String,
    prefixIcon: String,
    clearable: {
      type: Boolean,
      default: false
    },
    clearIcon: {
      type: String,
      default: 'el-icon-circle-close'
    },
    editable: {
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
    pickerOptions: {
      type: Object,
      default() {
        return PICKER_OPTIONS;
      }
    },
    shortcutValue: String,
    timezone: String,
    unlinkPanels: Boolean,
    validateEvent: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      type: 'daterange',
      pickerVisible: false,
      showClose: false,
      userInput: null,
      // value when picker opens, used to determine whether to emit change
      valueOnOpen: null,
      unwatchPickerOptions: null,
    };
  },

  watch: {
    pickerVisible(val) {
      if (this.readonly || this.pickerDisabled) return;
      if (val) {
        this.showPicker();
        this.valueOnOpen = Array.isArray(this.value) ? [...this.value] : this.value;
      } else {
        this.hidePicker();
        this.emitChange(this.value);
        this.userInput = null;
        this.$emit('blur', this);
        this.blur();
      }
    },
    parsedValue: {
      // 在绑定的时候立即执行
      immediate: true,
      handler(val) {
        if (this.picker) {
          this.picker.value = val;
        }
      }
    },
    defaultValue(val) {
      // NOTE: should eventually move to jsx style picker + panel ?
      if (this.picker) {
        this.picker.defaultValue = val;
      }
    }
  },

  computed: {
    ranged() {
      return this.type.indexOf('range') > -1;
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

    valueIsEmpty() {
      const val = this.value;
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length; i < len; i++) {
          if (val[i]) {
            return false;
          }
        }
      } else {
        if (val) {
          return false;
        }
      }
      return true;
    },

    selectionMode() {
      return 'day';
    },

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

    parsedValue() {
      if (!this.value) {
        return this.value; // component value is not set
      }

      const valueIsDateObject = isDateObject(this.value)
        || (Array.isArray(this.value) && this.value.every(isDateObject));
      if (valueIsDateObject) {
        return this.value;
      }

      if (this.valueFormat) {
        return parseAsFormatAndType(this.value, this.valueFormat, this.type, this.rangeSeparator)
          || this.value;
      }

      // 将绑定的数据转化成日期格式
      // Fixme 是否能正确转化
      return Array.isArray(this.value) ? this.value.map(val => new Date(val)) : new Date(this.value);
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

    firstInputId() {
      const obj = {};
      let id;
      if (this.ranged) {
        id = this.id && this.id[0];
      } else {
        id = this.id;
      }
      if (id) obj.id = id;
      return obj;
    },

    secondInputId() {
      const obj = {};
      let id;
      if (this.ranged) {
        id = this.id && this.id[1];
      }
      if (id) obj.id = id;
      return obj;
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

    // value转化成格式化的字符串
    formatToValue(date) {
      const isFormattable = isDateObject(date)
        || (Array.isArray(date) && date.every(isDateObject));
      if (this.valueFormat && isFormattable) {
        return formatAsFormatAndType(date, this.valueFormat, this.type);
      } else {
        return date;
      }
    },

    // 用户输入字符串转化成日期类型
    parseString(value) {
      const type = Array.isArray(value) ? this.type : this.type.replace('range', '');
      return parseAsFormatAndType(value, this.format, type);
    },

    // 用户输入的转化后的日期类型再格式化
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
        if (!this.ranged) {
          this.handleChange();
          this.pickerVisible = this.picker.visible = false;
          this.blur();
          event.stopPropagation();
        } else {
          // user may change focus between two input
          setTimeout(() => {
            if (this.refInput.indexOf(document.activeElement) === -1) {
              this.pickerVisible = false;
              this.blur();
              event.stopPropagation();
            }
          }, 0);
        }
        return;
      }

      // Enter
      if (keyCode === 13) {
        if (this.userInput === '' || this.isValidValue(this.parseString(this.displayValue))) {
          this.handleChange();
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

    // 处理键盘事件导致的弹窗关闭
    handleChange() {
      if (this.userInput) {
        const value = this.parseString(this.displayValue);
        if (value) {
          this.picker.value = value;
          if (this.isValidValue(value)) {
            this.emitInput(value);
            this.userInput = null;
          }
        }
      }
      if (this.userInput === '') {
        this.emitInput(null);
        this.emitChange(null);
        this.userInput = null;
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
          this.emitInput(newValue);
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
          this.emitInput(newValue);
          this.userInput = null;
        }
      }
    },

    // 清除选择的日期
    handleClickIcon(event) {
      if (this.readonly || this.pickerDisabled) return;
      if (this.showClose) {
        this.valueOnOpen = this.value;
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

      // 将格式化后的value
      this.picker.value = this.parsedValue;
      this.picker.resetView && this.picker.resetView();

      this.$nextTick(() => {
        this.picker.adjustSpinners && this.picker.adjustSpinners();
      });
    },

    mountPicker() {
      this.picker = new Vue(this.panel).$mount();
      this.picker.defaultValue = this.defaultValue;
      this.picker.popperClass = this.popperClass;
      this.popperElm = this.picker.$el;
      this.picker.width = this.reference.getBoundingClientRect().width;
      this.picker.showTime = false;
      this.picker.selectionMode = this.selectionMode;
      this.picker.unlinkPanels = this.unlinkPanels;
      this.picker.arrowControl = this.arrowControl || false;
      this.$watch('format', (format) => {
        this.picker.format = format;
      });

      const updateOptions = () => {
        const options = this.pickerOptions;

        for (const option in options) {
          if (options.hasOwnProperty(option)) {
            this.picker[option] = options[option];
          }
        }

        // main format must prevail over undocumented pickerOptions.format
        if (this.format) {
          this.picker.format = this.format;
        }
        if (this.shortcutValue) {
          this.picker.shortcutValue = this.shortcutValue;
        }
      };
      updateOptions();
      this.unwatchPickerOptions = this.$watch(
        'pickerOptions',
        () => updateOptions(),
        { deep: true }
      );
      const updateTimezone = () => {
        if (this.timezone) {
          this.picker.timezone = this.timezone;
        }
      };
      updateTimezone();
      this.unwatchPickerOptions = this.$watch(
        'timezone',
        () => updateTimezone()
      );
      this.$el.appendChild(this.picker.$el);
      this.picker.resetView && this.picker.resetView();

      this.picker.$on('dodestroy', this.doDestroy);
      this.picker.$on('pick', (date = '', visible = false) => {
        this.userInput = null;
        this.pickerVisible = this.picker.visible = visible;
        this.emitInput(date);
        this.picker.resetView && this.picker.resetView();
        // 判断选择的时间是否会命中shortcuts
        if (Array.isArray(date) && date.length === 2) {
          this.picker.shortcutValue = '';
          this.picker.shortcuts.forEach(item => {
            if (valueEquals(item.start, date[0]) && valueEquals(item.end, date[1])) {
              this.picker.shortcutValue = item.value;
            }
          })
          this.$emit('shortcut', this.picker.shortcutValue);
        }
      });
    },

    unmountPicker() {
      if (this.picker) {
        this.picker.$destroy();
        this.picker.$off();
        if (typeof this.unwatchPickerOptions === 'function') {
          this.unwatchPickerOptions();
        }
        this.picker.$el.parentNode.removeChild(this.picker.$el);
      }
    },

    emitChange(val) {
      // determine user real change only
      if (!valueEquals(val, this.valueOnOpen)) {
        this.$emit('change', val);
        this.valueOnOpen = val;
      }
    },

    emitInput(val) {
      const formatted = this.formatToValue(val);
      if (!valueEquals(this.value, formatted)) {
        this.$emit('input', formatted);
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
    }
  }
};
</script>
