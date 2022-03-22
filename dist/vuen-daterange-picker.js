(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
  typeof define === 'function' && define.amd ? define(['vue'], factory) :
  (global = global || self, global.VueNDaterangePicker = factory(global.Vue));
}(this, (function (Vue) { 'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

  const isDateObject = function (val) {
    return val instanceof Date;
  };

  function isString(val) {
    return typeof val === 'string' || val instanceof String;
  }

  const clearTime = function (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  const nextDate = function (date, amount = 1) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  };
  const prevDate = function (date, amount = 1) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - amount);
  };
  const getStartDateOfMonth = function (year, month) {
    const result = new Date(year, month, 1);
    const day = result.getDay();

    if (day === 0) {
      return prevDate(result, 7);
    }

    return prevDate(result, day);
  };
  const getDayCountOfMonth = function (year, month) {
    if (month === 3 || month === 5 || month === 8 || month === 10) {
      return 30;
    }

    if (month === 1) {
      if (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
        return 29;
      }

      return 28;
    }

    return 31;
  };
  const getFirstDayOfMonth = function (date) {
    const temp = new Date(date.getTime());
    temp.setDate(1);
    return temp.getDay();
  }; // 将日期类型转化成字符串, 忽略时分秒

  const formatDate = function (date, format = 'yyyy-MM-dd') {
    if (!isDateObject(date)) {
      return '';
    }

    function pad(number) {
      let r = String(number);

      if (r.length === 1) {
        r = '0' + r;
      }

      return r;
    }

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return format.replace(/yyyy/g, year).replace(/MM/g, month).replace(/dd/g, day);
  };

  function compile(format) {
    const re = /([A-Za-z])\1*|./g;
    let keys,
        pattern = [format];
    format = format.replace(/\[[^\[\]]*]|\[.*\][^\[]*\]/g, str => str.replace(/./g, ' ').slice(2));

    while (keys = re.exec(format)) {
      pattern[pattern.length] = keys[0];
    }

    return pattern;
  }

  function exec(re, str) {
    var result = (re.exec(str) || [''])[0];
    return {
      value: result | 0,
      length: result.length
    };
  } // 将字符串转化成中国标准时间, 忽略时分秒，默认00:00:00


  const parseDate = function (dateString, format = 'yyyy-MM-dd') {
    const parser = {
      'yyyy': function (str) {
        return exec(/^\d{4}/, str);
      },
      'MM': function (str) {
        return exec(/^\d\d/, str);
      },
      'dd': function (str) {
        return exec(/^\d\d/, str);
      }
    };
    const pattern = typeof format === 'string' ? compile(format) : format;
    let token,
        result,
        offset = 0,
        dt = {
      y: 1970,
      M: 1,
      d: 1,
      H: 0,
      m: 0,
      s: 0
    };

    for (let i = 1, len = pattern.length; i < len; i++) {
      token = pattern[i];

      if (parser[token]) {
        result = parser[token](dateString.slice(offset), pattern[0]);

        if (result.length) {
          offset += result.length;
          dt[token.charAt(0)] = result.value;
          dt._match++;
        }
      } else if (token === dateString.charAt(offset) || token === ' ') {
        offset++;
      }
    }

    dt.M -= dt.Y < 100 ? 22801 : 1;
    return new Date(dt.y, dt.M, dt.d, dt.H, dt.m, dt.s);
  };
  const modifyDate = function (date, y, m, d) {
    return new Date(y, m, d, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  };
  const changeYearMonthAndClampDate = function (date, year, month) {
    // clamp date to the number of days in `year`, `month`
    // eg: (2010-1-31, 2010, 2) => 2010-2-28
    const monthDate = Math.min(date.getDate(), getDayCountOfMonth(year, month));
    return modifyDate(date, year, month, monthDate);
  };
  const prevYear = function (date, amount = 1) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return changeYearMonthAndClampDate(date, year - amount, month);
  };
  const nextYear = function (date, amount = 1) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return changeYearMonthAndClampDate(date, year + amount, month);
  };
  const prevMonth = function (date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month === 0 ? changeYearMonthAndClampDate(date, year - 1, 11) : changeYearMonthAndClampDate(date, year, month - 1);
  };
  const nextMonth = function (date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month === 11 ? changeYearMonthAndClampDate(date, year + 1, 0) : changeYearMonthAndClampDate(date, year, month + 1);
  };
  const merge = function (target) {
    for (let i = 1, j = arguments.length; i < j; i++) {
      let source = arguments[i] || {};

      for (let prop in source) {
        // eslint-disable-next-line no-prototype-builtins
        if (source.hasOwnProperty(prop)) {
          let value = source[prop];

          if (value !== undefined) {
            target[prop] = value;
          }
        }
      }
    }

    return target;
  };
  /*
   * Considers:
   *   1. Date object
   *   2. date string
   *   3. array of 1 or 2
   */

  const valueEquals = function (a, b) {
    // considers Date object and string
    const dateEquals = function (a, b) {
      const aIsDate = a instanceof Date;
      const bIsDate = b instanceof Date;

      if (aIsDate && bIsDate) {
        return a.getTime() === b.getTime();
      }

      if (!aIsDate && !bIsDate) {
        return a === b;
      }

      return false;
    };

    const aIsArray = a instanceof Array;
    const bIsArray = b instanceof Array;

    if (aIsArray && bIsArray) {
      if (a.length !== b.length) {
        return false;
      }

      return a.every((item, index) => dateEquals(item, b[index]));
    }

    if (!aIsArray && !bIsArray) {
      return dateEquals(a, b);
    }

    return false;
  };
  const validator = function (val) {
    // either: String, Array of String, null / undefined
    return val === null || val === undefined || isString(val) || Array.isArray(val) && val.length === 2 && val.every(isString);
  };

  const PLACEMENT_MAP = {
    left: 'bottom-start',
    center: 'bottom',
    right: 'bottom-end'
  };
  const PICKER_OPTIONS = {
    shortcuts: [{
      text: 'Today',
      value: '0d'
    }, {
      text: 'Yesterday',
      value: '-1d'
    }, {
      text: 'Last 7 Days',
      value: '-7d'
    }, {
      text: 'Last Week',
      value: '-1w'
    }, {
      text: 'This Month',
      value: '0m'
    }, {
      text: 'Last Month',
      value: '-1m'
    }]
  };
  const DEFAULT_FORMATS = {
    daterange: 'yyyy-MM-dd',
    date: 'yyyy-MM-dd',
    datetime: 'yyyy-MM-dd HH:mm:ss'
  };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  //
  // 所以要clearTime

  const getDateTimestamp = function (time) {
    if (typeof time === 'number' || typeof time === 'string') {
      return clearTime(new Date(time)).getTime();
    } else if (time instanceof Date) {
      return clearTime(time).getTime();
    } else {
      return NaN;
    }
  };

  var script = {
    props: {
      firstDayOfWeek: {
        default: 1,
        type: Number,
        validator: val => val >= 1 && val <= 7
      },
      value: {},
      defaultValue: {
        validator(val) {
          // either: null, valid Date object, Array of valid Date objects
          return val === null || isDateObject(val) || Array.isArray(val) && val.every(isDateObject);
        }

      },
      date: {},
      selectionMode: {
        default: 'range'
      },
      showWeekNumber: {
        type: Boolean,
        default: false
      },
      disabledDate: {},
      // dateRange透传，一般是function
      cellClassName: {},
      minDate: {},
      maxDate: {},
      rangeState: {
        default() {
          return {
            endDate: null,
            selecting: false
          };
        }

      }
    },

    data() {
      return {
        tableRows: [[], [], [], [], [], []],
        lastRow: null,
        lastColumn: null
      };
    },

    computed: {
      offsetDay() {
        const week = this.firstDayOfWeek; // 周日为界限，左右偏移的天数，3217654 例如周一就是 -1，目的是调整前两行日期的位置

        return week > 3 ? 7 - week : -week;
      },

      WEEKS() {
        const week = this.firstDayOfWeek;
        return WEEKS.concat(WEEKS).slice(week, week + 7);
      },

      year() {
        return this.date.getFullYear();
      },

      month() {
        return this.date.getMonth();
      },

      startDate() {
        return getStartDateOfMonth(this.year, this.month);
      },

      rows() {
        const date = new Date(this.year, this.month, 1);
        let day = getFirstDayOfMonth(date); // day of first day

        const dateCountOfMonth = getDayCountOfMonth(date.getFullYear(), date.getMonth());
        const dateCountOfLastMonth = getDayCountOfMonth(date.getFullYear(), date.getMonth() === 0 ? 11 : date.getMonth() - 1);
        day = day === 0 ? 7 : day;
        const offset = this.offsetDay; // rows改变，this.tableRows也会得到相应赋值

        const rows = this.tableRows;
        let count = 1;
        const startDate = this.startDate;
        const disabledDate = this.disabledDate;
        const cellClassName = this.cellClassName;
        const selectedDate = [];
        const now = getDateTimestamp(new Date());

        for (let i = 0; i < 6; i++) {
          const row = rows[i];

          for (let j = 0; j < 7; j++) {
            let cell = row[j];

            if (!cell) {
              cell = {
                row: i,
                column: j,
                type: 'normal',
                inRange: false,
                start: false,
                end: false
              };
            }

            cell.type = 'normal';
            const index = i * 7 + j;
            const time = nextDate(startDate, index - offset).getTime();
            cell.inRange = time >= getDateTimestamp(this.minDate) && time <= getDateTimestamp(this.maxDate);
            cell.start = this.minDate && time === getDateTimestamp(this.minDate);
            cell.end = this.maxDate && time === getDateTimestamp(this.maxDate);
            const isToday = time === now;

            if (isToday) {
              cell.type = 'today';
            }

            if (i >= 0 && i <= 1) {
              const numberOfDaysFromPreviousMonth = day + offset < 0 ? 7 + day + offset : day + offset;

              if (j + i * 7 >= numberOfDaysFromPreviousMonth) {
                cell.text = count++;
              } else {
                cell.text = dateCountOfLastMonth - (numberOfDaysFromPreviousMonth - j % 7) + 1 + i * 7;
                cell.type = 'prev-month';
              }
            } else {
              if (count <= dateCountOfMonth) {
                cell.text = count++;
              } else {
                cell.text = count++ - dateCountOfMonth;
                cell.type = 'next-month';
              }
            }

            let cellDate = new Date(time);
            cell.disabled = typeof disabledDate === 'function' && disabledDate(cellDate);
            cell.selected = selectedDate.find(data => date.getTime() === cellDate.getTime());
            cell.customClass = typeof cellClassName === 'function' && cellClassName(cellDate);
            this.$set(row, j, cell);
          }
        }

        return rows;
      }

    },
    watch: {
      'rangeState.endDate'(newVal) {
        this.markRange(this.minDate, newVal);
      },

      minDate(newVal, oldVal) {
        if (getDateTimestamp(newVal) !== getDateTimestamp(oldVal)) {
          this.markRange(this.minDate, this.maxDate);
        }
      },

      maxDate(newVal, oldVal) {
        if (getDateTimestamp(newVal) !== getDateTimestamp(oldVal)) {
          this.markRange(this.minDate, this.maxDate);
        }
      }

    },
    methods: {
      cellMatchesDate(cell, date) {
        const value = new Date(date);
        return this.year === value.getFullYear() && this.month === value.getMonth() && Number(cell.text) === value.getDate();
      },

      getCellClasses(cell) {
        const selectionMode = this.selectionMode;
        const defaultValue = this.defaultValue ? Array.isArray(this.defaultValue) ? this.defaultValue : [this.defaultValue] : [];
        let classes = [];

        if ((cell.type === 'normal' || cell.type === 'today') && !cell.disabled) {
          classes.push('available');

          if (cell.type === 'today') {
            classes.push('today');
          }
        } else {
          classes.push(cell.type);
        }

        if (cell.type === 'normal' && defaultValue.some(date => this.cellMatchesDate(cell, date))) {
          classes.push('default');
        }

        if (cell.inRange && (cell.type === 'normal' || cell.type === 'today')) {
          classes.push('in-range');

          if (cell.start) {
            classes.push('start-date');
          }

          if (cell.end) {
            classes.push('end-date');
          }
        }

        if (cell.disabled) {
          classes.push('disabled');
        }

        if (cell.selected) {
          classes.push('selected');
        }

        if (cell.customClass) {
          classes.push(cell.customClass);
        }

        return classes.join(' ');
      },

      getDateOfCell(row, column) {
        const offsetFromStart = row * 7 + column - this.offsetDay;
        return nextDate(this.startDate, offsetFromStart);
      },

      markRange(minDate, maxDate) {
        minDate = getDateTimestamp(minDate);
        maxDate = getDateTimestamp(maxDate) || minDate;
        [minDate, maxDate] = [Math.min(minDate, maxDate), Math.max(minDate, maxDate)];
        const startDate = this.startDate;
        const rows = this.rows;

        for (let i = 0, k = rows.length; i < k; i++) {
          const row = rows[i];

          for (let j = 0, l = row.length; j < l; j++) {
            const cell = row[j];
            const index = i * 7 + j;
            const time = nextDate(startDate, index - this.offsetDay).getTime();
            cell.inRange = minDate && time >= minDate && time <= maxDate;
            cell.start = minDate && time === minDate;
            cell.end = maxDate && time === maxDate;
          }
        }
      },

      handleMouseMove(event) {
        if (!this.rangeState.selecting) return;
        let target = event.target;

        if (target.tagName === 'SPAN') {
          target = target.parentNode.parentNode;
        }

        if (target.tagName === 'DIV') {
          target = target.parentNode;
        }

        if (target.tagName !== 'TD') return;
        const row = target.parentNode.rowIndex - 1;
        const column = target.cellIndex; // can not select disabled date

        if (this.rows[row][column].disabled) return; // only update rangeState when mouse moves to a new cell
        // this avoids frequent Date object creation and improves performance

        if (row !== this.lastRow || column !== this.lastColumn) {
          this.lastRow = row;
          this.lastColumn = column;
          this.$emit('changerange', {
            minDate: this.minDate,
            maxDate: this.maxDate,
            rangeState: {
              selecting: true,
              endDate: this.getDateOfCell(row, column)
            }
          });
        }
      },

      // 选择日期，发送pick事件
      handleClick(event) {
        let target = event.target;

        if (target.tagName === 'SPAN') {
          target = target.parentNode.parentNode;
        }

        if (target.tagName === 'DIV') {
          target = target.parentNode;
        }

        if (target.tagName !== 'TD') return;
        const row = target.parentNode.rowIndex - 1;
        const column = target.cellIndex;
        const cell = this.rows[row][column];
        if (cell.disabled) return;
        const newDate = this.getDateOfCell(row, column);

        if (this.selectionMode === 'range') {
          if (!this.rangeState.selecting) {
            this.$emit('pick', {
              minDate: newDate,
              maxDate: null
            });
            this.rangeState.selecting = true;
          } else {
            if (newDate >= this.minDate) {
              this.$emit('pick', {
                minDate: this.minDate,
                maxDate: newDate
              });
            } else {
              this.$emit('pick', {
                minDate: newDate,
                maxDate: this.minDate
              });
            }

            this.rangeState.selecting = false;
          }
        }
      }

    }
  };

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
      createInjectorSSR = createInjector;
      createInjector = shadowMode;
      shadowMode = false;
    } // Vue.extend constructor export interop.


    const options = typeof script === 'function' ? script.options : script; // render functions

    if (template && template.render) {
      options.render = template.render;
      options.staticRenderFns = template.staticRenderFns;
      options._compiled = true; // functional template

      if (isFunctionalTemplate) {
        options.functional = true;
      }
    } // scopedId


    if (scopeId) {
      options._scopeId = scopeId;
    }

    let hook;

    if (moduleIdentifier) {
      // server build
      hook = function (context) {
        // 2.3 injection
        context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
        // 2.2 with runInNewContext: true

        if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
          context = __VUE_SSR_CONTEXT__;
        } // inject component styles


        if (style) {
          style.call(this, createInjectorSSR(context));
        } // register component module identifier for async chunk inference


        if (context && context._registeredComponents) {
          context._registeredComponents.add(moduleIdentifier);
        }
      }; // used by ssr in case component is cached and beforeCreate
      // never gets called


      options._ssrRegister = hook;
    } else if (style) {
      hook = shadowMode ? function (context) {
        style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
      } : function (context) {
        style.call(this, createInjector(context));
      };
    }

    if (hook) {
      if (options.functional) {
        // register for functional component in vue file
        const originalRender = options.render;

        options.render = function renderWithStyleInjection(h, context) {
          hook.call(context);
          return originalRender(h, context);
        };
      } else {
        // inject component registration as beforeCreate hook
        const existing = options.beforeCreate;
        options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
      }
    }

    return script;
  }

  const isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

  function createInjector(context) {
    return (id, style) => addStyle(id, style);
  }

  let HEAD;
  const styles = {};

  function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = {
      ids: new Set(),
      styles: []
    });

    if (!style.ids.has(id)) {
      style.ids.add(id);
      let code = css.source;

      if (css.map) {
        // https://developer.chrome.com/devtools/docs/javascript-debugging
        // this makes source maps inside style tags work properly in Chrome
        code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

        code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
      }

      if (!style.element) {
        style.element = document.createElement('style');
        style.element.type = 'text/css';
        if (css.media) style.element.setAttribute('media', css.media);

        if (HEAD === undefined) {
          HEAD = document.head || document.getElementsByTagName('head')[0];
        }

        HEAD.appendChild(style.element);
      }

      if ('styleSheet' in style.element) {
        style.styles.push(code);
        style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
      } else {
        const index = style.ids.size - 1;
        const textNode = document.createTextNode(code);
        const nodes = style.element.childNodes;
        if (nodes[index]) style.element.removeChild(nodes[index]);
        if (nodes.length) style.element.insertBefore(textNode, nodes[index]);else style.element.appendChild(textNode);
      }
    }
  }

  /* script */
  const __vue_script__ = script;

  /* template */
  var __vue_render__ = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "table",
      {
        staticClass: "el-date-table",
        attrs: { cellspacing: "0", cellpadding: "0" },
        on: { click: _vm.handleClick, mousemove: _vm.handleMouseMove }
      },
      [
        _c(
          "tbody",
          [
            _c(
              "tr",
              _vm._l(_vm.WEEKS, function(week, key) {
                return _c("th", { key: key }, [
                  _vm._v("\n        " + _vm._s(week) + "\n      ")
                ])
              }),
              0
            ),
            _vm._v(" "),
            _vm._l(_vm.rows, function(row, key) {
              return _c(
                "tr",
                { key: key, staticClass: "el-date-table__row" },
                _vm._l(row, function(cell, key2) {
                  return _c(
                    "td",
                    { key: key2, class: _vm.getCellClasses(cell) },
                    [_c("div", [_c("span", [_vm._v(_vm._s(cell.text))])])]
                  )
                }),
                0
              )
            })
          ],
          2
        )
      ]
    )
  };
  var __vue_staticRenderFns__ = [];
  __vue_render__._withStripped = true;

    /* style */
    const __vue_inject_styles__ = undefined;
    /* scoped */
    const __vue_scope_id__ = undefined;
    /* module identifier */
    const __vue_module_identifier__ = undefined;
    /* functional template */
    const __vue_is_functional_template__ = false;
    /* style inject */

    /* style inject SSR */

    /* style inject shadow dom */



    const __vue_component__ = normalizeComponent(
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      false,
      undefined,
      undefined,
      undefined
    );

  //

  const calcDefaultValue = defaultValue => {
    if (Array.isArray(defaultValue)) {
      return [new Date(defaultValue[0]), new Date(defaultValue[1])];
    } else if (defaultValue) {
      return [new Date(defaultValue), nextDate(new Date(defaultValue), 1)];
    } else {
      return [new Date(), nextDate(new Date(), 1)];
    }
  };

  var script$1 = {
    components: {
      DateTable: __vue_component__
    },

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
        return this.unlinkPanels && new Date(this.leftYear + yearOffset, nextMonth) < new Date(this.rightYear, this.rightMonth);
      },

      enableYearArrow() {
        return this.unlinkPanels && this.rightYear * 12 + this.rightMonth - (this.leftYear * 12 + this.leftMonth + 1) >= 12;
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
              this.rightDate = minDateYear === maxDateYear && minDateMonth === maxDateMonth ? nextMonth(this.maxDate) : this.maxDate;
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
          this.rightDate = val && val[1] && this.unlinkPanels ? right : nextMonth(this.leftDate);
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
        this.minDate = val.minDate; // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57

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
            dateRange: [this.minDate, this.maxDate]
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
        return value && Array.isArray(value) && value[0] && isDateObject(value[0]) && value[1] && isDateObject(value[1]) && value[0].getTime() <= value[1].getTime() && (typeof this.disabledDate === 'function' ? !this.disabledDate(value[0]) && !this.disabledDate(value[1]) : true);
      },

      resetView() {
        // NOTE: this is a hack to reset {min, max}Date on picker open.
        // TODO: correct way of doing so is to refactor {min, max}Date to be dependent on value and internal selection state
        // an alternative would be resetView whenever picker becomes visible, should also investigate date-panel's resetView
        if (this.minDate && this.maxDate == null) {
          this.rangeState.selecting = false;
        }

        this.minDate = this.value && isDateObject(this.value[0]) ? new Date(this.value[0]) : null;
        this.maxDate = this.value && isDateObject(this.value[0]) ? new Date(this.value[1]) : null;
      }

    }
  };

  /* script */
  const __vue_script__$1 = script$1;

  /* template */
  var __vue_render__$1 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "transition",
      {
        attrs: { name: "el-zoom-in-top" },
        on: {
          "after-leave": function($event) {
            return _vm.$emit("dodestroy")
          }
        }
      },
      [
        _c(
          "div",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.visible,
                expression: "visible"
              }
            ],
            staticClass: "el-picker-panel el-date-range-picker el-popper",
            class: [
              {
                "has-sidebar": _vm.$slots.sidebar || _vm.shortcuts
              },
              _vm.popperClass
            ]
          },
          [
            _c("div", { staticClass: "el-picker-panel__body-wrapper" }, [
              _vm.shortcuts
                ? _c(
                    "div",
                    { staticClass: "el-picker-panel__sidebar" },
                    _vm._l(_vm.shortcuts, function(shortcut, key) {
                      return _c("div", { key: key }, [
                        _c(
                          "button",
                          {
                            staticClass:
                              "el-button is-plain el-button--medium el-picker-panel__shortcut",
                            class: {
                              "el-button--primary is-disabled":
                                shortcut.value == _vm.shortcutValue
                            },
                            attrs: {
                              type: "button",
                              disabled: shortcut.value == _vm.shortcutValue
                            },
                            on: {
                              click: function($event) {
                                return _vm.handleShortcutClick(shortcut)
                              }
                            }
                          },
                          [
                            _vm._v(
                              "\n            " +
                                _vm._s(shortcut.text) +
                                "\n          "
                            )
                          ]
                        )
                      ])
                    }),
                    0
                  )
                : _vm._e(),
              _vm._v(" "),
              _c("div", { staticClass: "el-picker-panel__body" }, [
                _c(
                  "div",
                  {
                    staticClass:
                      "el-picker-panel__content el-date-range-picker__content is-left"
                  },
                  [
                    _c("div", { staticClass: "el-date-range-picker__header" }, [
                      _c("button", {
                        staticClass:
                          "el-picker-panel__icon-btn el-icon-d-arrow-left",
                        attrs: { type: "button" },
                        on: { click: _vm.leftPrevYear }
                      }),
                      _vm._v(" "),
                      _c("button", {
                        staticClass:
                          "el-picker-panel__icon-btn el-icon-arrow-left",
                        attrs: { type: "button" },
                        on: { click: _vm.leftPrevMonth }
                      }),
                      _vm._v(" "),
                      _vm.unlinkPanels
                        ? _c("button", {
                            staticClass:
                              "el-picker-panel__icon-btn el-icon-d-arrow-right",
                            class: { "is-disabled": !_vm.enableYearArrow },
                            attrs: {
                              type: "button",
                              disabled: !_vm.enableYearArrow
                            },
                            on: { click: _vm.leftNextYear }
                          })
                        : _vm._e(),
                      _vm._v(" "),
                      _vm.unlinkPanels
                        ? _c("button", {
                            staticClass:
                              "el-picker-panel__icon-btn el-icon-arrow-right",
                            class: { "is-disabled": !_vm.enableMonthArrow },
                            attrs: {
                              type: "button",
                              disabled: !_vm.enableMonthArrow
                            },
                            on: { click: _vm.leftNextMonth }
                          })
                        : _vm._e(),
                      _vm._v(" "),
                      _c("div", [_vm._v(_vm._s(_vm.leftLabel))])
                    ]),
                    _vm._v(" "),
                    _c("date-table", {
                      attrs: {
                        "selection-mode": "range",
                        date: _vm.leftDate,
                        "default-value": _vm.defaultValue,
                        "min-date": _vm.minDate,
                        "max-date": _vm.maxDate,
                        "range-state": _vm.rangeState,
                        "disabled-date": _vm.disabledDate,
                        "cell-class-name": _vm.cellClassName,
                        "first-day-of-week": _vm.firstDayOfWeek
                      },
                      on: {
                        changerange: _vm.handleChangeRange,
                        pick: _vm.handleRangePick
                      }
                    })
                  ],
                  1
                ),
                _vm._v(" "),
                _c(
                  "div",
                  {
                    staticClass:
                      "el-picker-panel__content el-date-range-picker__content is-right"
                  },
                  [
                    _c("div", { staticClass: "el-date-range-picker__header" }, [
                      _vm.unlinkPanels
                        ? _c("button", {
                            staticClass:
                              "el-picker-panel__icon-btn el-icon-d-arrow-left",
                            class: { "is-disabled": !_vm.enableYearArrow },
                            attrs: {
                              type: "button",
                              disabled: !_vm.enableYearArrow
                            },
                            on: { click: _vm.rightPrevYear }
                          })
                        : _vm._e(),
                      _vm._v(" "),
                      _vm.unlinkPanels
                        ? _c("button", {
                            staticClass:
                              "el-picker-panel__icon-btn el-icon-arrow-left",
                            class: { "is-disabled": !_vm.enableMonthArrow },
                            attrs: {
                              type: "button",
                              disabled: !_vm.enableMonthArrow
                            },
                            on: { click: _vm.rightPrevMonth }
                          })
                        : _vm._e(),
                      _vm._v(" "),
                      _c("button", {
                        staticClass:
                          "el-picker-panel__icon-btn el-icon-d-arrow-right",
                        attrs: { type: "button" },
                        on: { click: _vm.rightNextYear }
                      }),
                      _vm._v(" "),
                      _c("button", {
                        staticClass:
                          "el-picker-panel__icon-btn el-icon-arrow-right",
                        attrs: { type: "button" },
                        on: { click: _vm.rightNextMonth }
                      }),
                      _vm._v(" "),
                      _c("div", [_vm._v(_vm._s(_vm.rightLabel))])
                    ]),
                    _vm._v(" "),
                    _c("date-table", {
                      attrs: {
                        "selection-mode": "range",
                        date: _vm.rightDate,
                        "default-value": _vm.defaultValue,
                        "min-date": _vm.minDate,
                        "max-date": _vm.maxDate,
                        "range-state": _vm.rangeState,
                        "disabled-date": _vm.disabledDate,
                        "cell-class-name": _vm.cellClassName,
                        "first-day-of-week": _vm.firstDayOfWeek
                      },
                      on: {
                        changerange: _vm.handleChangeRange,
                        pick: _vm.handleRangePick
                      }
                    })
                  ],
                  1
                )
              ])
            ])
          ]
        )
      ]
    )
  };
  var __vue_staticRenderFns__$1 = [];
  __vue_render__$1._withStripped = true;

    /* style */
    const __vue_inject_styles__$1 = function (inject) {
      if (!inject) return
      inject("data-v-2709d7ca_0", { source: "\n.el-date-range-picker.has-sidebar[data-v-2709d7ca] {\n  width: 806px;\n  z-index: 100;\n}\n.el-picker-panel__sidebar[data-v-2709d7ca] {\n  width: 160px;\n  padding: 8px;\n}\n.el-picker-panel__sidebar > div[data-v-2709d7ca] {\n  margin-bottom: 8px;\n}\n.el-picker-panel__sidebar + .el-picker-panel__body[data-v-2709d7ca] {\n  margin-left: 160px;\n}\n", map: {"version":3,"sources":["/Users/xiashan/Site/vue-plugin/vueN-daterange-picker/src/panel/DateRange.vue"],"names":[],"mappings":";AAqZA;EACA,YAAA;EACA,YAAA;AACA;AACA;EACA,YAAA;EACA,YAAA;AACA;AACA;EACA,kBAAA;AACA;AACA;EACA,kBAAA;AACA","file":"DateRange.vue","sourcesContent":["<template>\n  <transition name=\"el-zoom-in-top\" @after-leave=\"$emit('dodestroy')\">\n    <div\n      v-show=\"visible\"\n      class=\"el-picker-panel el-date-range-picker el-popper\"\n      :class=\"[\n        {\n          'has-sidebar': $slots.sidebar || shortcuts\n        },\n        popperClass\n      ]\"\n    >\n      <div class=\"el-picker-panel__body-wrapper\">\n        <div v-if=\"shortcuts\" class=\"el-picker-panel__sidebar\">\n          <div v-for=\"(shortcut, key) in shortcuts\" :key=\"key\">\n            <button\n              type=\"button\"\n              class=\"el-button is-plain el-button--medium el-picker-panel__shortcut\"\n              :class=\"{ 'el-button--primary is-disabled': shortcut.value == shortcutValue }\"\n              :disabled=\"shortcut.value == shortcutValue\"\n              @click=\"handleShortcutClick(shortcut)\"\n            >\n              {{ shortcut.text }}\n            </button>\n          </div>\n        </div>\n        <div class=\"el-picker-panel__body\">\n          <div class=\"el-picker-panel__content el-date-range-picker__content is-left\">\n            <div class=\"el-date-range-picker__header\">\n              <button\n                type=\"button\"\n                class=\"el-picker-panel__icon-btn el-icon-d-arrow-left\"\n                @click=\"leftPrevYear\"\n              ></button>\n              <button\n                type=\"button\"\n                class=\"el-picker-panel__icon-btn el-icon-arrow-left\"\n                @click=\"leftPrevMonth\"\n              ></button>\n              <button\n                v-if=\"unlinkPanels\"\n                type=\"button\"\n                :disabled=\"!enableYearArrow\"\n                :class=\"{ 'is-disabled': !enableYearArrow }\"\n                class=\"el-picker-panel__icon-btn el-icon-d-arrow-right\"\n                @click=\"leftNextYear\"\n              ></button>\n              <button\n                v-if=\"unlinkPanels\"\n                type=\"button\"\n                :disabled=\"!enableMonthArrow\"\n                :class=\"{ 'is-disabled': !enableMonthArrow }\"\n                class=\"el-picker-panel__icon-btn el-icon-arrow-right\"\n                @click=\"leftNextMonth\"\n              ></button>\n              <div>{{ leftLabel }}</div>\n            </div>\n            <date-table\n              selection-mode=\"range\"\n              :date=\"leftDate\"\n              :default-value=\"defaultValue\"\n              :min-date=\"minDate\"\n              :max-date=\"maxDate\"\n              :range-state=\"rangeState\"\n              :disabled-date=\"disabledDate\"\n              :cell-class-name=\"cellClassName\"\n              :first-day-of-week=\"firstDayOfWeek\"\n              @changerange=\"handleChangeRange\"\n              @pick=\"handleRangePick\"\n            >\n            </date-table>\n          </div>\n          <div class=\"el-picker-panel__content el-date-range-picker__content is-right\">\n            <div class=\"el-date-range-picker__header\">\n              <button\n                v-if=\"unlinkPanels\"\n                type=\"button\"\n                :disabled=\"!enableYearArrow\"\n                :class=\"{ 'is-disabled': !enableYearArrow }\"\n                class=\"el-picker-panel__icon-btn el-icon-d-arrow-left\"\n                @click=\"rightPrevYear\"\n              ></button>\n              <button\n                v-if=\"unlinkPanels\"\n                type=\"button\"\n                :disabled=\"!enableMonthArrow\"\n                :class=\"{ 'is-disabled': !enableMonthArrow }\"\n                class=\"el-picker-panel__icon-btn el-icon-arrow-left\"\n                @click=\"rightPrevMonth\"\n              ></button>\n              <button\n                type=\"button\"\n                class=\"el-picker-panel__icon-btn el-icon-d-arrow-right\"\n                @click=\"rightNextYear\"\n              ></button>\n              <button\n                type=\"button\"\n                class=\"el-picker-panel__icon-btn el-icon-arrow-right\"\n                @click=\"rightNextMonth\"\n              ></button>\n              <div>{{ rightLabel }}</div>\n            </div>\n            <date-table\n              selection-mode=\"range\"\n              :date=\"rightDate\"\n              :default-value=\"defaultValue\"\n              :min-date=\"minDate\"\n              :max-date=\"maxDate\"\n              :range-state=\"rangeState\"\n              :disabled-date=\"disabledDate\"\n              :cell-class-name=\"cellClassName\"\n              :first-day-of-week=\"firstDayOfWeek\"\n              @changerange=\"handleChangeRange\"\n              @pick=\"handleRangePick\"\n            >\n            </date-table>\n          </div>\n        </div>\n      </div>\n    </div>\n  </transition>\n</template>\n\n<script type=\"text/babel\">\nimport {\n  isDateObject,\n  prevYear,\n  nextYear,\n  prevMonth,\n  nextMonth,\n  nextDate\n} from '../util/util';\nimport DateTable from '../basic/DateTable.vue';\n\nimport { MONTHS } from '../util/const';\n\n// 计算defaultValue\nconst calcDefaultValue = (defaultValue) => {\n  if (Array.isArray(defaultValue)) {\n    return [new Date(defaultValue[0]), new Date(defaultValue[1])];\n  } else if (defaultValue) {\n    return [new Date(defaultValue), nextDate(new Date(defaultValue), 1)];\n  } else {\n    return [new Date(), nextDate(new Date(), 1)];\n  }\n};\n\nexport default {\n  components: { DateTable },\n\n  data() {\n    return {\n      popperClass: '',\n      value: [],\n      defaultValue: null,\n      minDate: '',\n      maxDate: '',\n      leftDate: new Date(),\n      rightDate: nextMonth(new Date()),\n      rangeState: {\n        endDate: null,\n        selecting: false,\n        row: null,\n        column: null\n      },\n      shortcuts: '',\n      shortcutValue: '',\n      timezone: '',\n      visible: '',\n      disabledDate: '',\n      cellClassName: '',\n      firstDayOfWeek: 1,\n      arrowControl: false,\n      unlinkPanels: false\n    };\n  },\n\n  computed: {\n    leftLabel() {\n      return `${MONTHS[this.leftDate.getMonth()]} ${this.leftDate.getFullYear()}`;\n    },\n\n    rightLabel() {\n      return `${MONTHS[this.rightDate.getMonth()]} ${this.rightDate.getFullYear()}`;\n    },\n\n    leftYear() {\n      return this.leftDate.getFullYear();\n    },\n\n    leftMonth() {\n      return this.leftDate.getMonth();\n    },\n\n    leftMonthDate() {\n      return this.leftDate.getDate();\n    },\n\n    rightYear() {\n      return this.rightDate.getFullYear();\n    },\n\n    rightMonth() {\n      return this.rightDate.getMonth();\n    },\n\n    rightMonthDate() {\n      return this.rightDate.getDate();\n    },\n\n    enableMonthArrow() {\n      const nextMonth = (this.leftMonth + 1) % 12;\n      const yearOffset = this.leftMonth + 1 >= 12 ? 1 : 0;\n      return (\n        this.unlinkPanels &&\n        new Date(this.leftYear + yearOffset, nextMonth) <\n          new Date(this.rightYear, this.rightMonth)\n      );\n    },\n\n    enableYearArrow() {\n      return (\n        this.unlinkPanels &&\n        this.rightYear * 12 +\n          this.rightMonth -\n          (this.leftYear * 12 + this.leftMonth + 1) >=\n          12\n      );\n    }\n  },\n\n  watch: {\n    // 通过value(array)计算minDate,maxDate以及leftDate和rightDate\n    value(newVal) {\n      if (!newVal) {\n        this.minDate = null;\n        this.maxDate = null;\n      } else if (Array.isArray(newVal)) {\n        this.minDate = isDateObject(newVal[0]) ? new Date(newVal[0]) : null;\n        this.maxDate = isDateObject(newVal[1]) ? new Date(newVal[1]) : null;\n        if (this.minDate) {\n          this.leftDate = this.minDate;\n          if (this.unlinkPanels && this.maxDate) {\n            const minDateYear = this.minDate.getFullYear();\n            const minDateMonth = this.minDate.getMonth();\n            const maxDateYear = this.maxDate.getFullYear();\n            const maxDateMonth = this.maxDate.getMonth();\n            this.rightDate =\n              minDateYear === maxDateYear && minDateMonth === maxDateMonth\n                ? nextMonth(this.maxDate)\n                : this.maxDate;\n          } else {\n            this.rightDate = nextMonth(this.leftDate);\n          }\n        } else {\n          this.leftDate = calcDefaultValue(this.defaultValue)[0];\n          this.rightDate = nextMonth(this.leftDate);\n        }\n      }\n    },\n\n    // 通过defaultValue计算leftData和rightDate\n    // 但this.value的优先级比较高\n    defaultValue(val) {\n      if (!Array.isArray(this.value)) {\n        const [left, right] = calcDefaultValue(val);\n        this.leftDate = left;\n        this.rightDate =\n          val && val[1] && this.unlinkPanels ? right : nextMonth(this.leftDate);\n      }\n    }\n  },\n\n  methods: {\n    handleClear() {\n      this.minDate = null;\n      this.maxDate = null;\n      this.leftDate = calcDefaultValue(this.defaultValue)[0];\n      this.rightDate = nextMonth(this.leftDate);\n    },\n\n    // 选中一个日期后，移动鼠标\n    handleChangeRange(val) {\n      this.minDate = val.minDate;\n      this.maxDate = val.maxDate;\n      this.rangeState = val.rangeState;\n    },\n\n    // 选中日期面板中的日期\n    // { minDate, maxDate }\n    handleRangePick(val, close = true) {\n      if (this.maxDate === val.maxDate && this.minDate === val.minDate) {\n        return;\n      }\n      this.maxDate = val.maxDate;\n      this.minDate = val.minDate;\n\n      // workaround for https://github.com/ElemeFE/element/issues/7539, should remove this block when we don't have to care about Chromium 55 - 57\n      setTimeout(() => {\n        this.maxDate = val.maxDate;\n        this.minDate = val.minDate;\n      }, 10);\n      if (!close) return;\n      this.handleConfirm();\n    },\n\n    // 选择左侧的区间\n    // 对应的日期放到picker中计算\n    handleShortcutClick(shortcut) {\n      this.shortcutValue = shortcut.value;\n      this.$emit('pick', {\n        shortcut: shortcut.value\n      });\n    },\n\n    // 选择日期区间\n    // shortcut放到picker中计算\n    handleConfirm(visible = false) {\n      if (this.isValidValue([this.minDate, this.maxDate])) {\n        // 判断选择的日期有没匹配到区间\n        this.$emit('pick', {\n          dateRange: [this.minDate, this.maxDate],\n        }, visible);\n      }\n    },\n\n    // leftPrev*, rightNext* need to take care of `unlinkPanels`\n    leftPrevYear() {\n      this.leftDate = prevYear(this.leftDate);\n      if (!this.unlinkPanels) {\n        this.rightDate = nextMonth(this.leftDate);\n      }\n    },\n\n    leftPrevMonth() {\n      this.leftDate = prevMonth(this.leftDate);\n      if (!this.unlinkPanels) {\n        this.rightDate = nextMonth(this.leftDate);\n      }\n    },\n\n    rightNextYear() {\n      if (!this.unlinkPanels) {\n        this.leftDate = nextYear(this.leftDate);\n        this.rightDate = nextMonth(this.leftDate);\n      } else {\n        this.rightDate = nextYear(this.rightDate);\n      }\n    },\n\n    rightNextMonth() {\n      if (!this.unlinkPanels) {\n        this.leftDate = nextMonth(this.leftDate);\n        this.rightDate = nextMonth(this.leftDate);\n      } else {\n        this.rightDate = nextMonth(this.rightDate);\n      }\n    },\n\n    // leftNext*, rightPrev* are called when `unlinkPanels` is true\n    leftNextYear() {\n      this.leftDate = nextYear(this.leftDate);\n    },\n\n    leftNextMonth() {\n      this.leftDate = nextMonth(this.leftDate);\n    },\n\n    rightPrevYear() {\n      this.rightDate = prevYear(this.rightDate);\n    },\n\n    rightPrevMonth() {\n      this.rightDate = prevMonth(this.rightDate);\n    },\n\n    isValidValue(value) {\n      return (\n        value && Array.isArray(value) &&\n        value[0] && isDateObject(value[0]) &&\n        value[1] && isDateObject(value[1]) &&\n        value[0].getTime() <= value[1].getTime() &&\n        (typeof this.disabledDate === 'function'\n          ? !this.disabledDate(value[0]) && !this.disabledDate(value[1])\n          : true)\n      );\n    },\n\n    resetView() {\n      // NOTE: this is a hack to reset {min, max}Date on picker open.\n      // TODO: correct way of doing so is to refactor {min, max}Date to be dependent on value and internal selection state\n      // an alternative would be resetView whenever picker becomes visible, should also investigate date-panel's resetView\n      if (this.minDate && this.maxDate == null) {\n        this.rangeState.selecting = false;\n      }\n      this.minDate =\n        this.value && isDateObject(this.value[0]) ? new Date(this.value[0]) : null;\n      this.maxDate =\n        this.value && isDateObject(this.value[0]) ? new Date(this.value[1]) : null;\n    }\n  }\n};\n</script>\n\n<style scoped>\n.el-date-range-picker.has-sidebar {\n  width: 806px;\n  z-index: 100;\n}\n.el-picker-panel__sidebar {\n  width: 160px;\n  padding: 8px;\n}\n.el-picker-panel__sidebar > div {\n  margin-bottom: 8px;\n}\n.el-picker-panel__sidebar + .el-picker-panel__body {\n  margin-left: 160px;\n}\n</style>\n"]}, media: undefined });

    };
    /* scoped */
    const __vue_scope_id__$1 = "data-v-2709d7ca";
    /* module identifier */
    const __vue_module_identifier__$1 = undefined;
    /* functional template */
    const __vue_is_functional_template__$1 = false;
    /* style inject SSR */

    /* style inject shadow dom */



    const __vue_component__$1 = normalizeComponent(
      { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
      __vue_inject_styles__$1,
      __vue_script__$1,
      __vue_scope_id__$1,
      __vue_is_functional_template__$1,
      __vue_module_identifier__$1,
      false,
      createInjector,
      undefined,
      undefined
    );

  const on = function () {
    if (document.addEventListener) {
      return function (element, event, handler) {
        if (element && event && handler) {
          element.addEventListener(event, handler, false);
        }
      };
    } else {
      return function (element, event, handler) {
        if (element && event && handler) {
          element.attachEvent('on' + event, handler);
        }
      };
    }
  }();

  const nodeList = [];
  const ctx = '@@clickoutsideContext';
  let startClick;
  let seed = 0;
  on(document, 'mousedown', e => startClick = e);
  on(document, 'mouseup', e => {
    nodeList.forEach(node => node[ctx].documentHandler(e, startClick));
  });

  function createDocumentHandler(el, binding, vnode) {
    return function (mouseup = {}, mousedown = {}) {
      if (!vnode || !vnode.context || !mouseup.target || !mousedown.target || el.contains(mouseup.target) || el.contains(mousedown.target) || el === mouseup.target || vnode.context.popperElm && (vnode.context.popperElm.contains(mouseup.target) || vnode.context.popperElm.contains(mousedown.target))) return;

      if (binding.expression && el[ctx].methodName && vnode.context[el[ctx].methodName]) {
        vnode.context[el[ctx].methodName]();
      } else {
        el[ctx].bindingFn && el[ctx].bindingFn();
      }
    };
  }
  /**
   * v-clickoutside
   * @desc 点击元素外面才会触发的事件
   * @example
   * ```vue
   * <div v-element-clickoutside="handleClose">
   * ```
   */


  var Clickoutside = {
    bind(el, binding, vnode) {
      nodeList.push(el);
      const id = seed++;
      el[ctx] = {
        id,
        documentHandler: createDocumentHandler(el, binding, vnode),
        methodName: binding.expression,
        bindingFn: binding.value
      };
    },

    update(el, binding, vnode) {
      el[ctx].documentHandler = createDocumentHandler(el, binding, vnode);
      el[ctx].methodName = binding.expression;
      el[ctx].bindingFn = binding.value;
    },

    unbind(el) {
      let len = nodeList.length;

      for (let i = 0; i < len; i++) {
        if (nodeList[i][ctx].id === el[ctx].id) {
          nodeList.splice(i, 1);
          break;
        }
      }

      delete el[ctx];
    }

  };

  /**!
   * @fileOverview Kickass library to create and place poppers near their reference elements.
   * @version 1.16.0
   * @license
   * Copyright (c) 2016 Federico Zivolo and contributors
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   */
  var e = "undefined" != typeof window && "undefined" != typeof document && "undefined" != typeof navigator,
      t = function () {
    for (var t = ["Edge", "Trident", "Firefox"], o = 0; o < t.length; o += 1) if (e && navigator.userAgent.indexOf(t[o]) >= 0) return 1;

    return 0;
  }();

  var o = e && window.Promise ? function (e) {
    var t = !1;
    return function () {
      t || (t = !0, window.Promise.resolve().then(function () {
        t = !1, e();
      }));
    };
  } : function (e) {
    var o = !1;
    return function () {
      o || (o = !0, setTimeout(function () {
        o = !1, e();
      }, t));
    };
  };

  function n(e) {
    return e && "[object Function]" === {}.toString.call(e);
  }

  function r(e, t) {
    if (1 !== e.nodeType) return [];
    var o = e.ownerDocument.defaultView.getComputedStyle(e, null);
    return t ? o[t] : o;
  }

  function i(e) {
    return "HTML" === e.nodeName ? e : e.parentNode || e.host;
  }

  function s(e) {
    if (!e) return document.body;

    switch (e.nodeName) {
      case "HTML":
      case "BODY":
        return e.ownerDocument.body;

      case "#document":
        return e.body;
    }

    var t = r(e),
        o = t.overflow,
        n = t.overflowX,
        p = t.overflowY;
    return /(auto|scroll|overlay)/.test(o + p + n) ? e : s(i(e));
  }

  function p(e) {
    return e && e.referenceNode ? e.referenceNode : e;
  }

  var a = e && !(!window.MSInputMethodContext || !document.documentMode),
      f = e && /MSIE 10/.test(navigator.userAgent);

  function l(e) {
    return 11 === e ? a : 10 === e ? f : a || f;
  }

  function d(e) {
    if (!e) return document.documentElement;

    for (var t = l(10) ? document.body : null, o = e.offsetParent || null; o === t && e.nextElementSibling;) o = (e = e.nextElementSibling).offsetParent;

    var n = o && o.nodeName;
    return n && "BODY" !== n && "HTML" !== n ? -1 !== ["TH", "TD", "TABLE"].indexOf(o.nodeName) && "static" === r(o, "position") ? d(o) : o : e ? e.ownerDocument.documentElement : document.documentElement;
  }

  function c(e) {
    return null !== e.parentNode ? c(e.parentNode) : e;
  }

  function u(e, t) {
    if (!(e && e.nodeType && t && t.nodeType)) return document.documentElement;
    var o = e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING,
        n = o ? e : t,
        r = o ? t : e,
        i = document.createRange();
    i.setStart(n, 0), i.setEnd(r, 0);
    var s,
        p,
        a = i.commonAncestorContainer;
    if (e !== a && t !== a || n.contains(r)) return "BODY" === (p = (s = a).nodeName) || "HTML" !== p && d(s.firstElementChild) !== s ? d(a) : a;
    var f = c(e);
    return f.host ? u(f.host, t) : u(e, c(t).host);
  }

  function h(e) {
    var t = "top" === (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "top") ? "scrollTop" : "scrollLeft",
        o = e.nodeName;

    if ("BODY" === o || "HTML" === o) {
      var n = e.ownerDocument.documentElement;
      return (e.ownerDocument.scrollingElement || n)[t];
    }

    return e[t];
  }

  function m(e, t) {
    var o = "x" === t ? "Left" : "Top",
        n = "Left" === o ? "Right" : "Bottom";
    return parseFloat(e["border" + o + "Width"], 10) + parseFloat(e["border" + n + "Width"], 10);
  }

  function v(e, t, o, n) {
    return Math.max(t["offset" + e], t["scroll" + e], o["client" + e], o["offset" + e], o["scroll" + e], l(10) ? parseInt(o["offset" + e]) + parseInt(n["margin" + ("Height" === e ? "Top" : "Left")]) + parseInt(n["margin" + ("Height" === e ? "Bottom" : "Right")]) : 0);
  }

  function g(e) {
    var t = e.body,
        o = e.documentElement,
        n = l(10) && getComputedStyle(o);
    return {
      height: v("Height", t, o, n),
      width: v("Width", t, o, n)
    };
  }

  var b = function (e, t) {
    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
  },
      w = function () {
    function e(e, t) {
      for (var o = 0; o < t.length; o++) {
        var n = t[o];
        n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n);
      }
    }

    return function (t, o, n) {
      return o && e(t.prototype, o), n && e(t, n), t;
    };
  }(),
      y = function (e, t, o) {
    return t in e ? Object.defineProperty(e, t, {
      value: o,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[t] = o, e;
  },
      E = Object.assign || function (e) {
    for (var t = 1; t < arguments.length; t++) {
      var o = arguments[t];

      for (var n in o) Object.prototype.hasOwnProperty.call(o, n) && (e[n] = o[n]);
    }

    return e;
  };

  function O(e) {
    return E({}, e, {
      right: e.left + e.width,
      bottom: e.top + e.height
    });
  }

  function x(e) {
    var t = {};

    try {
      if (l(10)) {
        t = e.getBoundingClientRect();
        var o = h(e, "top"),
            n = h(e, "left");
        t.top += o, t.left += n, t.bottom += o, t.right += n;
      } else t = e.getBoundingClientRect();
    } catch (e) {}

    var i = {
      left: t.left,
      top: t.top,
      width: t.right - t.left,
      height: t.bottom - t.top
    },
        s = "HTML" === e.nodeName ? g(e.ownerDocument) : {},
        p = s.width || e.clientWidth || i.width,
        a = s.height || e.clientHeight || i.height,
        f = e.offsetWidth - p,
        d = e.offsetHeight - a;

    if (f || d) {
      var c = r(e);
      f -= m(c, "x"), d -= m(c, "y"), i.width -= f, i.height -= d;
    }

    return O(i);
  }

  function S(e, t) {
    var o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
        n = l(10),
        i = "HTML" === t.nodeName,
        p = x(e),
        a = x(t),
        f = s(e),
        d = r(t),
        c = parseFloat(d.borderTopWidth, 10),
        u = parseFloat(d.borderLeftWidth, 10);
    o && i && (a.top = Math.max(a.top, 0), a.left = Math.max(a.left, 0));
    var m = O({
      top: p.top - a.top - c,
      left: p.left - a.left - u,
      width: p.width,
      height: p.height
    });

    if (m.marginTop = 0, m.marginLeft = 0, !n && i) {
      var v = parseFloat(d.marginTop, 10),
          g = parseFloat(d.marginLeft, 10);
      m.top -= c - v, m.bottom -= c - v, m.left -= u - g, m.right -= u - g, m.marginTop = v, m.marginLeft = g;
    }

    return (n && !o ? t.contains(f) : t === f && "BODY" !== f.nodeName) && (m = function (e, t) {
      var o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
          n = h(t, "top"),
          r = h(t, "left"),
          i = o ? -1 : 1;
      return e.top += n * i, e.bottom += n * i, e.left += r * i, e.right += r * i, e;
    }(m, t)), m;
  }

  function L(e) {
    if (!e || !e.parentElement || l()) return document.documentElement;

    for (var t = e.parentElement; t && "none" === r(t, "transform");) t = t.parentElement;

    return t || document.documentElement;
  }

  function C(e, t, o, n) {
    var a = arguments.length > 4 && void 0 !== arguments[4] && arguments[4],
        f = {
      top: 0,
      left: 0
    },
        l = a ? L(e) : u(e, p(t));
    if ("viewport" === n) f = function (e) {
      var t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
          o = e.ownerDocument.documentElement,
          n = S(e, o),
          r = Math.max(o.clientWidth, window.innerWidth || 0),
          i = Math.max(o.clientHeight, window.innerHeight || 0),
          s = t ? 0 : h(o),
          p = t ? 0 : h(o, "left");
      return O({
        top: s - n.top + n.marginTop,
        left: p - n.left + n.marginLeft,
        width: r,
        height: i
      });
    }(l, a);else {
      var d = void 0;
      "scrollParent" === n ? "BODY" === (d = s(i(t))).nodeName && (d = e.ownerDocument.documentElement) : d = "window" === n ? e.ownerDocument.documentElement : n;
      var c = S(d, l, a);
      if ("HTML" !== d.nodeName || function e(t) {
        var o = t.nodeName;
        if ("BODY" === o || "HTML" === o) return !1;
        if ("fixed" === r(t, "position")) return !0;
        var n = i(t);
        return !!n && e(n);
      }(l)) f = c;else {
        var m = g(e.ownerDocument),
            v = m.height,
            b = m.width;
        f.top += c.top - c.marginTop, f.bottom = v + c.top, f.left += c.left - c.marginLeft, f.right = b + c.left;
      }
    }
    var w = "number" == typeof (o = o || 0);
    return f.left += w ? o : o.left || 0, f.top += w ? o : o.top || 0, f.right -= w ? o : o.right || 0, f.bottom -= w ? o : o.bottom || 0, f;
  }

  function T(e, t, o, n, r) {
    var i = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : 0;
    if (-1 === e.indexOf("auto")) return e;
    var s = C(o, n, i, r),
        p = {
      top: {
        width: s.width,
        height: t.top - s.top
      },
      right: {
        width: s.right - t.right,
        height: s.height
      },
      bottom: {
        width: s.width,
        height: s.bottom - t.bottom
      },
      left: {
        width: t.left - s.left,
        height: s.height
      }
    },
        a = Object.keys(p).map(function (e) {
      return E({
        key: e
      }, p[e], {
        area: (t = p[e], t.width * t.height)
      });
      var t;
    }).sort(function (e, t) {
      return t.area - e.area;
    }),
        f = a.filter(function (e) {
      var t = e.width,
          n = e.height;
      return t >= o.clientWidth && n >= o.clientHeight;
    }),
        l = f.length > 0 ? f[0].key : a[0].key,
        d = e.split("-")[1];
    return l + (d ? "-" + d : "");
  }

  function N(e, t, o) {
    var n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : null;
    return S(o, n ? L(t) : u(t, p(o)), n);
  }

  function D(e) {
    var t = e.ownerDocument.defaultView.getComputedStyle(e),
        o = parseFloat(t.marginTop || 0) + parseFloat(t.marginBottom || 0),
        n = parseFloat(t.marginLeft || 0) + parseFloat(t.marginRight || 0);
    return {
      width: e.offsetWidth + n,
      height: e.offsetHeight + o
    };
  }

  function F(e) {
    var t = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom"
    };
    return e.replace(/left|right|bottom|top/g, function (e) {
      return t[e];
    });
  }

  function M(e, t, o) {
    o = o.split("-")[0];
    var n = D(e),
        r = {
      width: n.width,
      height: n.height
    },
        i = -1 !== ["right", "left"].indexOf(o),
        s = i ? "top" : "left",
        p = i ? "left" : "top",
        a = i ? "height" : "width",
        f = i ? "width" : "height";
    return r[s] = t[s] + t[a] / 2 - n[a] / 2, r[p] = o === p ? t[p] - n[f] : t[F(p)], r;
  }

  function P(e, t) {
    return Array.prototype.find ? e.find(t) : e.filter(t)[0];
  }

  function A(e, t, o) {
    return (void 0 === o ? e : e.slice(0, function (e, t, o) {
      if (Array.prototype.findIndex) return e.findIndex(function (e) {
        return e[t] === o;
      });
      var n = P(e, function (e) {
        return e[t] === o;
      });
      return e.indexOf(n);
    }(e, "name", o))).forEach(function (e) {
      e.function && console.warn("`modifier.function` is deprecated, use `modifier.fn`!");
      var o = e.function || e.fn;
      e.enabled && n(o) && (t.offsets.popper = O(t.offsets.popper), t.offsets.reference = O(t.offsets.reference), t = o(t, e));
    }), t;
  }

  function B() {
    if (!this.state.isDestroyed) {
      var e = {
        instance: this,
        styles: {},
        arrowStyles: {},
        attributes: {},
        flipped: !1,
        offsets: {}
      };
      e.offsets.reference = N(this.state, this.popper, this.reference, this.options.positionFixed), e.placement = T(this.options.placement, e.offsets.reference, this.popper, this.reference, this.options.modifiers.flip.boundariesElement, this.options.modifiers.flip.padding), e.originalPlacement = e.placement, e.positionFixed = this.options.positionFixed, e.offsets.popper = M(this.popper, e.offsets.reference, e.placement), e.offsets.popper.position = this.options.positionFixed ? "fixed" : "absolute", e = A(this.modifiers, e), this.state.isCreated ? this.options.onUpdate(e) : (this.state.isCreated = !0, this.options.onCreate(e));
    }
  }

  function k(e, t) {
    return e.some(function (e) {
      var o = e.name;
      return e.enabled && o === t;
    });
  }

  function W(e) {
    for (var t = [!1, "ms", "Webkit", "Moz", "O"], o = e.charAt(0).toUpperCase() + e.slice(1), n = 0; n < t.length; n++) {
      var r = t[n],
          i = r ? "" + r + o : e;
      if (void 0 !== document.body.style[i]) return i;
    }

    return null;
  }

  function H() {
    return this.state.isDestroyed = !0, k(this.modifiers, "applyStyle") && (this.popper.removeAttribute("x-placement"), this.popper.style.position = "", this.popper.style.top = "", this.popper.style.left = "", this.popper.style.right = "", this.popper.style.bottom = "", this.popper.style.willChange = "", this.popper.style[W("transform")] = ""), this.disableEventListeners(), this.options.removeOnDestroy && this.popper.parentNode.removeChild(this.popper), this;
  }

  function _(e) {
    var t = e.ownerDocument;
    return t ? t.defaultView : window;
  }

  function I(e, t, o, n) {
    o.updateBound = n, _(e).addEventListener("resize", o.updateBound, {
      passive: !0
    });
    var r = s(e);
    return function e(t, o, n, r) {
      var i = "BODY" === t.nodeName,
          p = i ? t.ownerDocument.defaultView : t;
      p.addEventListener(o, n, {
        passive: !0
      }), i || e(s(p.parentNode), o, n, r), r.push(p);
    }(r, "scroll", o.updateBound, o.scrollParents), o.scrollElement = r, o.eventsEnabled = !0, o;
  }

  function R() {
    this.state.eventsEnabled || (this.state = I(this.reference, this.options, this.state, this.scheduleUpdate));
  }

  function j() {
    var e, t;
    this.state.eventsEnabled && (cancelAnimationFrame(this.scheduleUpdate), this.state = (e = this.reference, t = this.state, _(e).removeEventListener("resize", t.updateBound), t.scrollParents.forEach(function (e) {
      e.removeEventListener("scroll", t.updateBound);
    }), t.updateBound = null, t.scrollParents = [], t.scrollElement = null, t.eventsEnabled = !1, t));
  }

  function J(e) {
    return "" !== e && !isNaN(parseFloat(e)) && isFinite(e);
  }

  function U(e, t) {
    Object.keys(t).forEach(function (o) {
      var n = "";
      -1 !== ["width", "height", "top", "right", "bottom", "left"].indexOf(o) && J(t[o]) && (n = "px"), e.style[o] = t[o] + n;
    });
  }

  var $ = e && /Firefox/i.test(navigator.userAgent);

  function V(e, t, o) {
    var n = P(e, function (e) {
      return e.name === t;
    }),
        r = !!n && e.some(function (e) {
      return e.name === o && e.enabled && e.order < n.order;
    });

    if (!r) {
      var i = "`" + t + "`",
          s = "`" + o + "`";
      console.warn(s + " modifier is required by " + i + " modifier in order to work, be sure to include it before " + i + "!");
    }

    return r;
  }

  var Y = ["auto-start", "auto", "auto-end", "top-start", "top", "top-end", "right-start", "right", "right-end", "bottom-end", "bottom", "bottom-start", "left-end", "left", "left-start"],
      q = Y.slice(3);

  function K(e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
        o = q.indexOf(e),
        n = q.slice(o + 1).concat(q.slice(0, o));
    return t ? n.reverse() : n;
  }

  var z = {
    FLIP: "flip",
    CLOCKWISE: "clockwise",
    COUNTERCLOCKWISE: "counterclockwise"
  };

  function G(e, t, o, n) {
    var r = [0, 0],
        i = -1 !== ["right", "left"].indexOf(n),
        s = e.split(/(\+|\-)/).map(function (e) {
      return e.trim();
    }),
        p = s.indexOf(P(s, function (e) {
      return -1 !== e.search(/,|\s/);
    }));
    s[p] && -1 === s[p].indexOf(",") && console.warn("Offsets separated by white space(s) are deprecated, use a comma (,) instead.");
    var a = /\s*,\s*|\s+/,
        f = -1 !== p ? [s.slice(0, p).concat([s[p].split(a)[0]]), [s[p].split(a)[1]].concat(s.slice(p + 1))] : [s];
    return (f = f.map(function (e, n) {
      var r = (1 === n ? !i : i) ? "height" : "width",
          s = !1;
      return e.reduce(function (e, t) {
        return "" === e[e.length - 1] && -1 !== ["+", "-"].indexOf(t) ? (e[e.length - 1] = t, s = !0, e) : s ? (e[e.length - 1] += t, s = !1, e) : e.concat(t);
      }, []).map(function (e) {
        return function (e, t, o, n) {
          var r = e.match(/((?:\-|\+)?\d*\.?\d*)(.*)/),
              i = +r[1],
              s = r[2];
          if (!i) return e;

          if (0 === s.indexOf("%")) {
            var p = void 0;

            switch (s) {
              case "%p":
                p = o;
                break;

              case "%":
              case "%r":
              default:
                p = n;
            }

            return O(p)[t] / 100 * i;
          }

          if ("vh" === s || "vw" === s) {
            return ("vh" === s ? Math.max(document.documentElement.clientHeight, window.innerHeight || 0) : Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) / 100 * i;
          }

          return i;
        }(e, r, t, o);
      });
    })).forEach(function (e, t) {
      e.forEach(function (o, n) {
        J(o) && (r[t] += o * ("-" === e[n - 1] ? -1 : 1));
      });
    }), r;
  }

  var X = {
    placement: "bottom",
    positionFixed: !1,
    eventsEnabled: !0,
    removeOnDestroy: !1,
    onCreate: function () {},
    onUpdate: function () {},
    modifiers: {
      shift: {
        order: 100,
        enabled: !0,
        fn: function (e) {
          var t = e.placement,
              o = t.split("-")[0],
              n = t.split("-")[1];

          if (n) {
            var r = e.offsets,
                i = r.reference,
                s = r.popper,
                p = -1 !== ["bottom", "top"].indexOf(o),
                a = p ? "left" : "top",
                f = p ? "width" : "height",
                l = {
              start: y({}, a, i[a]),
              end: y({}, a, i[a] + i[f] - s[f])
            };
            e.offsets.popper = E({}, s, l[n]);
          }

          return e;
        }
      },
      offset: {
        order: 200,
        enabled: !0,
        fn: function (e, t) {
          var o = t.offset,
              n = e.placement,
              r = e.offsets,
              i = r.popper,
              s = r.reference,
              p = n.split("-")[0],
              a = void 0;
          return a = J(+o) ? [+o, 0] : G(o, i, s, p), "left" === p ? (i.top += a[0], i.left -= a[1]) : "right" === p ? (i.top += a[0], i.left += a[1]) : "top" === p ? (i.left += a[0], i.top -= a[1]) : "bottom" === p && (i.left += a[0], i.top += a[1]), e.popper = i, e;
        },
        offset: 0
      },
      preventOverflow: {
        order: 300,
        enabled: !0,
        fn: function (e, t) {
          var o = t.boundariesElement || d(e.instance.popper);
          e.instance.reference === o && (o = d(o));
          var n = W("transform"),
              r = e.instance.popper.style,
              i = r.top,
              s = r.left,
              p = r[n];
          r.top = "", r.left = "", r[n] = "";
          var a = C(e.instance.popper, e.instance.reference, t.padding, o, e.positionFixed);
          r.top = i, r.left = s, r[n] = p, t.boundaries = a;
          var f = t.priority,
              l = e.offsets.popper,
              c = {
            primary: function (e) {
              var o = l[e];
              return l[e] < a[e] && !t.escapeWithReference && (o = Math.max(l[e], a[e])), y({}, e, o);
            },
            secondary: function (e) {
              var o = "right" === e ? "left" : "top",
                  n = l[o];
              return l[e] > a[e] && !t.escapeWithReference && (n = Math.min(l[o], a[e] - ("right" === e ? l.width : l.height))), y({}, o, n);
            }
          };
          return f.forEach(function (e) {
            var t = -1 !== ["left", "top"].indexOf(e) ? "primary" : "secondary";
            l = E({}, l, c[t](e));
          }), e.offsets.popper = l, e;
        },
        priority: ["left", "right", "top", "bottom"],
        padding: 5,
        boundariesElement: "scrollParent"
      },
      keepTogether: {
        order: 400,
        enabled: !0,
        fn: function (e) {
          var t = e.offsets,
              o = t.popper,
              n = t.reference,
              r = e.placement.split("-")[0],
              i = Math.floor,
              s = -1 !== ["top", "bottom"].indexOf(r),
              p = s ? "right" : "bottom",
              a = s ? "left" : "top",
              f = s ? "width" : "height";
          return o[p] < i(n[a]) && (e.offsets.popper[a] = i(n[a]) - o[f]), o[a] > i(n[p]) && (e.offsets.popper[a] = i(n[p])), e;
        }
      },
      arrow: {
        order: 500,
        enabled: !0,
        fn: function (e, t) {
          var o;
          if (!V(e.instance.modifiers, "arrow", "keepTogether")) return e;
          var n = t.element;

          if ("string" == typeof n) {
            if (!(n = e.instance.popper.querySelector(n))) return e;
          } else if (!e.instance.popper.contains(n)) return console.warn("WARNING: `arrow.element` must be child of its popper element!"), e;

          var i = e.placement.split("-")[0],
              s = e.offsets,
              p = s.popper,
              a = s.reference,
              f = -1 !== ["left", "right"].indexOf(i),
              l = f ? "height" : "width",
              d = f ? "Top" : "Left",
              c = d.toLowerCase(),
              u = f ? "left" : "top",
              h = f ? "bottom" : "right",
              m = D(n)[l];
          a[h] - m < p[c] && (e.offsets.popper[c] -= p[c] - (a[h] - m)), a[c] + m > p[h] && (e.offsets.popper[c] += a[c] + m - p[h]), e.offsets.popper = O(e.offsets.popper);
          var v = a[c] + a[l] / 2 - m / 2,
              g = r(e.instance.popper),
              b = parseFloat(g["margin" + d], 10),
              w = parseFloat(g["border" + d + "Width"], 10),
              E = v - e.offsets.popper[c] - b - w;
          return E = Math.max(Math.min(p[l] - m, E), 0), e.arrowElement = n, e.offsets.arrow = (y(o = {}, c, Math.round(E)), y(o, u, ""), o), e;
        },
        element: "[x-arrow]"
      },
      flip: {
        order: 600,
        enabled: !0,
        fn: function (e, t) {
          if (k(e.instance.modifiers, "inner")) return e;
          if (e.flipped && e.placement === e.originalPlacement) return e;
          var o = C(e.instance.popper, e.instance.reference, t.padding, t.boundariesElement, e.positionFixed),
              n = e.placement.split("-")[0],
              r = F(n),
              i = e.placement.split("-")[1] || "",
              s = [];

          switch (t.behavior) {
            case z.FLIP:
              s = [n, r];
              break;

            case z.CLOCKWISE:
              s = K(n);
              break;

            case z.COUNTERCLOCKWISE:
              s = K(n, !0);
              break;

            default:
              s = t.behavior;
          }

          return s.forEach(function (p, a) {
            if (n !== p || s.length === a + 1) return e;
            n = e.placement.split("-")[0], r = F(n);
            var f = e.offsets.popper,
                l = e.offsets.reference,
                d = Math.floor,
                c = "left" === n && d(f.right) > d(l.left) || "right" === n && d(f.left) < d(l.right) || "top" === n && d(f.bottom) > d(l.top) || "bottom" === n && d(f.top) < d(l.bottom),
                u = d(f.left) < d(o.left),
                h = d(f.right) > d(o.right),
                m = d(f.top) < d(o.top),
                v = d(f.bottom) > d(o.bottom),
                g = "left" === n && u || "right" === n && h || "top" === n && m || "bottom" === n && v,
                b = -1 !== ["top", "bottom"].indexOf(n),
                w = !!t.flipVariations && (b && "start" === i && u || b && "end" === i && h || !b && "start" === i && m || !b && "end" === i && v),
                y = !!t.flipVariationsByContent && (b && "start" === i && h || b && "end" === i && u || !b && "start" === i && v || !b && "end" === i && m),
                O = w || y;
            (c || g || O) && (e.flipped = !0, (c || g) && (n = s[a + 1]), O && (i = function (e) {
              return "end" === e ? "start" : "start" === e ? "end" : e;
            }(i)), e.placement = n + (i ? "-" + i : ""), e.offsets.popper = E({}, e.offsets.popper, M(e.instance.popper, e.offsets.reference, e.placement)), e = A(e.instance.modifiers, e, "flip"));
          }), e;
        },
        behavior: "flip",
        padding: 5,
        boundariesElement: "viewport",
        flipVariations: !1,
        flipVariationsByContent: !1
      },
      inner: {
        order: 700,
        enabled: !1,
        fn: function (e) {
          var t = e.placement,
              o = t.split("-")[0],
              n = e.offsets,
              r = n.popper,
              i = n.reference,
              s = -1 !== ["left", "right"].indexOf(o),
              p = -1 === ["top", "left"].indexOf(o);
          return r[s ? "left" : "top"] = i[o] - (p ? r[s ? "width" : "height"] : 0), e.placement = F(t), e.offsets.popper = O(r), e;
        }
      },
      hide: {
        order: 800,
        enabled: !0,
        fn: function (e) {
          if (!V(e.instance.modifiers, "hide", "preventOverflow")) return e;
          var t = e.offsets.reference,
              o = P(e.instance.modifiers, function (e) {
            return "preventOverflow" === e.name;
          }).boundaries;

          if (t.bottom < o.top || t.left > o.right || t.top > o.bottom || t.right < o.left) {
            if (!0 === e.hide) return e;
            e.hide = !0, e.attributes["x-out-of-boundaries"] = "";
          } else {
            if (!1 === e.hide) return e;
            e.hide = !1, e.attributes["x-out-of-boundaries"] = !1;
          }

          return e;
        }
      },
      computeStyle: {
        order: 850,
        enabled: !0,
        fn: function (e, t) {
          var o = t.x,
              n = t.y,
              r = e.offsets.popper,
              i = P(e.instance.modifiers, function (e) {
            return "applyStyle" === e.name;
          }).gpuAcceleration;
          void 0 !== i && console.warn("WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!");

          var s = void 0 !== i ? i : t.gpuAcceleration,
              p = d(e.instance.popper),
              a = x(p),
              f = {
            position: r.position
          },
              l = function (e, t) {
            var o = e.offsets,
                n = o.popper,
                r = o.reference,
                i = Math.round,
                s = Math.floor,
                p = function (e) {
              return e;
            },
                a = i(r.width),
                f = i(n.width),
                l = -1 !== ["left", "right"].indexOf(e.placement),
                d = -1 !== e.placement.indexOf("-"),
                c = t ? l || d || a % 2 == f % 2 ? i : s : p,
                u = t ? i : p;

            return {
              left: c(a % 2 == 1 && f % 2 == 1 && !d && t ? n.left - 1 : n.left),
              top: u(n.top),
              bottom: u(n.bottom),
              right: c(n.right)
            };
          }(e, window.devicePixelRatio < 2 || !$),
              c = "bottom" === o ? "top" : "bottom",
              u = "right" === n ? "left" : "right",
              h = W("transform"),
              m = void 0,
              v = void 0;

          if (v = "bottom" === c ? "HTML" === p.nodeName ? -p.clientHeight + l.bottom : -a.height + l.bottom : l.top, m = "right" === u ? "HTML" === p.nodeName ? -p.clientWidth + l.right : -a.width + l.right : l.left, s && h) f[h] = "translate3d(" + m + "px, " + v + "px, 0)", f[c] = 0, f[u] = 0, f.willChange = "transform";else {
            var g = "bottom" === c ? -1 : 1,
                b = "right" === u ? -1 : 1;
            f[c] = v * g, f[u] = m * b, f.willChange = c + ", " + u;
          }
          var w = {
            "x-placement": e.placement
          };
          return e.attributes = E({}, w, e.attributes), e.styles = E({}, f, e.styles), e.arrowStyles = E({}, e.offsets.arrow, e.arrowStyles), e;
        },
        gpuAcceleration: !0,
        x: "bottom",
        y: "right"
      },
      applyStyle: {
        order: 900,
        enabled: !0,
        fn: function (e) {
          var t, o;
          return U(e.instance.popper, e.styles), t = e.instance.popper, o = e.attributes, Object.keys(o).forEach(function (e) {
            !1 !== o[e] ? t.setAttribute(e, o[e]) : t.removeAttribute(e);
          }), e.arrowElement && Object.keys(e.arrowStyles).length && U(e.arrowElement, e.arrowStyles), e;
        },
        onLoad: function (e, t, o, n, r) {
          var i = N(r, t, e, o.positionFixed),
              s = T(o.placement, i, t, e, o.modifiers.flip.boundariesElement, o.modifiers.flip.padding);
          return t.setAttribute("x-placement", s), U(t, {
            position: o.positionFixed ? "fixed" : "absolute"
          }), o;
        },
        gpuAcceleration: void 0
      }
    }
  },
      Q = function () {
    function e(t, r) {
      var i = this,
          s = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
      b(this, e), this.scheduleUpdate = function () {
        return requestAnimationFrame(i.update);
      }, this.update = o(this.update.bind(this)), this.options = E({}, e.Defaults, s), this.state = {
        isDestroyed: !1,
        isCreated: !1,
        scrollParents: []
      }, this.reference = t && t.jquery ? t[0] : t, this.popper = r && r.jquery ? r[0] : r, this.options.modifiers = {}, Object.keys(E({}, e.Defaults.modifiers, s.modifiers)).forEach(function (t) {
        i.options.modifiers[t] = E({}, e.Defaults.modifiers[t] || {}, s.modifiers ? s.modifiers[t] : {});
      }), this.modifiers = Object.keys(this.options.modifiers).map(function (e) {
        return E({
          name: e
        }, i.options.modifiers[e]);
      }).sort(function (e, t) {
        return e.order - t.order;
      }), this.modifiers.forEach(function (e) {
        e.enabled && n(e.onLoad) && e.onLoad(i.reference, i.popper, i.options, e, i.state);
      }), this.update();
      var p = this.options.eventsEnabled;
      p && this.enableEventListeners(), this.state.eventsEnabled = p;
    }

    return w(e, [{
      key: "update",
      value: function () {
        return B.call(this);
      }
    }, {
      key: "destroy",
      value: function () {
        return H.call(this);
      }
    }, {
      key: "enableEventListeners",
      value: function () {
        return R.call(this);
      }
    }, {
      key: "disableEventListeners",
      value: function () {
        return j.call(this);
      }
    }]), e;
  }();

  Q.Utils = ("undefined" != typeof window ? window : global).PopperUtils, Q.placements = Y, Q.Defaults = X;
  var Z = {
    props: {
      transformOrigin: {
        type: [Boolean, String],
        default: !0
      },
      boundariesSelector: String,
      reference: {},
      popper: {},
      disabled: {
        type: Boolean,
        default: !1
      },
      visibleArrow: {
        type: Boolean,
        default: !0
      },
      appendToBody: {
        type: Boolean,
        default: !0
      },
      options: {
        type: Object,
        default: () => ({})
      }
    },
    data: () => ({
      showPopper: !1,
      popperJS: null,
      referenceElm: null,
      popperElm: null,
      popperOptions: {
        placement: "bottom",
        computeStyle: {
          gpuAcceleration: !1
        }
      }
    }),
    watch: {
      showPopper(e) {
        this.disabled || (e ? (this.popperJS && this.popperJS.enableEventListeners(), this.$emit("show", this), this.updatePopper()) : (this.popperJS && this.popperJS.disableEventListeners(), this.$emit("hide", this)));
      },

      disabled(e) {
        e && (this.showPopper = !1);
      }

    },

    created() {
      this.popperOptions = Object.assign(this.popperOptions, this.options);
    },

    methods: {
      createPopper() {
        this.popperElm = this.popperElm || this.popper || this.$refs.popper, this.referenceElm = this.referenceElm || this.reference || this.$refs.reference || this.$slots.reference && this.$slots.reference[0];
        const e = this.popperElm,
              t = this.referenceElm;

        if (e && t) {
          if (this.visibleArrow && this.appendArrow(e), this.appendToBody && document.body.appendChild(e), this.boundariesSelector) {
            const e = document.querySelector(this.boundariesSelector);
            e && (this.popperOptions.modifiers = Object.assign({}, this.popperOptions.modifiers), this.popperOptions.modifiers.preventOverflow = Object.assign(this.popperOptions.modifiers.preventOverflow, {
              boundariesElement: e
            }));
          }

          this.popperOptions.onCreate = () => {
            this.$emit("created", this), this.$nextTick(this.updatePopper);
          }, this.popperJS && this.popperJS.destroy && this.popperJS.destroy(), this.popperJS = new Q(t, e, this.popperOptions);
        }
      },

      updatePopper() {
        this.popperJS ? this.popperJS.scheduleUpdate() : this.createPopper();
      },

      doDestroy(e) {
        !this.popperJS || this.showPopper && !e || (this.popperJS.destroy(), this.popperJS = null);
      },

      destroyPopper() {
        this.showPopper = !1, this.doDestroy();
      },

      appendArrow(e) {
        let t;
        if (this.appended) return;
        this.appended = !0;

        for (let o in e.attributes) if (/^_v-/.test(e.attributes[o].name)) {
          t = e.attributes[o].name;
          break;
        }

        const o = document.createElement("div");
        t && o.setAttribute(t, ""), o.setAttribute("x-arrow", ""), o.className = "popper__arrow", e.appendChild(o);
      }

    },

    beforeDestroy() {
      this.doDestroy(!0), this.popperElm && this.popperElm.parentNode === document.body && document.body.removeChild(this.popperElm);
    }

  };
  "undefined" != typeof navigator && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

  const ee = function (e, t, o, n, r, i, s, p, a, f) {
    "boolean" != typeof s && (a = p, p = s, s = !1);
    const l = "function" == typeof o ? o.options : o;
    let d;
    if (e && e.render && (l.render = e.render, l.staticRenderFns = e.staticRenderFns, l._compiled = !0, r && (l.functional = !0)), n && (l._scopeId = n), i ? (d = function (e) {
      (e = e || this.$vnode && this.$vnode.ssrContext || this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) || "undefined" == typeof __VUE_SSR_CONTEXT__ || (e = __VUE_SSR_CONTEXT__), t && t.call(this, a(e)), e && e._registeredComponents && e._registeredComponents.add(i);
    }, l._ssrRegister = d) : t && (d = s ? function (e) {
      t.call(this, f(e, this.$root.$options.shadowRoot));
    } : function (e) {
      t.call(this, p(e));
    }), d) if (l.functional) {
      const e = l.render;

      l.render = function (t, o) {
        return d.call(o), e(t, o);
      };
    } else {
      const e = l.beforeCreate;
      l.beforeCreate = e ? [].concat(e, d) : [d];
    }
    return o;
  }({}, void 0, Z, void 0, void 0, void 0, !1, void 0, void 0, void 0);

  //
  const NewPopper = {
    props: {
      appendToBody: ee.props.appendToBody,
      visibleArrow: ee.props.visibleArrow
    },
    methods: ee.methods,

    data() {
      return merge({
        popperOptions: {
          placement: 'bottom'
        }
      }, ee.data);
    },

    beforeDestroy: ee.beforeDestroy
  }; // 标准时间转化成字符串

  const DATE_FORMATTER = (value, format) => {
    if (format === 'timestamp') {
      return value.getTime();
    }

    return formatDate(value, format);
  }; // 字符串转化成标准时间


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
  }; // 支持单个date和range两种形式的parse


  const parseAsFormatAndType = (value, customFormat, type, rangeSeparator = '/') => {
    if (!value) return null;
    const format = customFormat || DEFAULT_FORMATS[type]; // 单独修改startDate或endDate

    if (type === 'date') {
      return DATE_PARSER(value, format);
    }

    return RANGE_PARSER(value, format, rangeSeparator);
  }; // 支持单个date和range两种形式的format


  const formatAsFormatAndType = (value, customFormat, type) => {
    if (!value) return null;
    const format = customFormat || DEFAULT_FORMATS[type];

    if (type === 'date') {
      return DATE_FORMATTER(value, format);
    }

    return RANGE_FORMATTER(value, format);
  };

  var script$2 = {
    mixins: [NewPopper],
    directives: {
      Clickoutside
    },
    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },
    props: {
      name: {
        default: '',
        validator
      },
      value: {},
      defaultValue: {},
      // 透传给picker，决定panel面板的日期
      size: String,
      format: {
        // 页面展示的格式
        type: String,
        default: 'yyyy-MM-dd'
      },
      valueFormat: {
        // 给定参数(一般是string)的格式
        type: String,
        default: 'yyyy-MM-dd'
      },
      readonly: Boolean,
      // 日期选择只读
      disabled: Boolean,
      // 日期选择禁止操作
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
      editable: {
        // input是否可以直接修改来修改日期
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
        showClose: false,
        // 显示clear图标
        userInput: null,
        // input框的用户输入
        valueOnOpen: null,
        // picker重新选择前的值，用来决定是否emit change事件, string
        unwatchTimezone: null,
        openValue: this.value
      };
    },

    watch: {
      pickerVisible(val) {
        if (this.readonly || this.pickerDisabled) return;

        if (val) {
          this.showPicker();
          this.valueOnOpen = Array.isArray(this.dateValue) ? [...this.dateValue] : this.dateValue;
        } else {
          this.hidePicker();
          this.emitChange({
            dateRange: this.dateValue,
            shortcut: this.shortcutValue
          });
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
        } // 如果shortcut存在，那么根据shortcut计算dateRange


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
        } // 如果dateRange存在，那么根据dateRange计算shortcut


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
        } // 已经是日期类型，直接返回


        const valueIsDateObject = isDateObject(this.dateValue) || Array.isArray(this.dateValue) && this.dateValue.every(isDateObject);

        if (valueIsDateObject) {
          return this.dateValue;
        }

        if (this.valueFormat) {
          return parseAsFormatAndType(this.dateValue, this.valueFormat, this.type, this.rangeSeparator) || this.dateValue;
        } // 将绑定的数据转化成日期格式,采用默认格式'yyyy-MM-dd'


        return Array.isArray(this.dateValue) ? this.dateValue.map(val => DATE_PARSER(val)) : DATE_PARSER(this.dateValue);
      },

      // 页面显示的值
      displayValue() {
        const formattedValue = formatAsFormatAndType(this.parsedValue, this.format, this.type);

        if (Array.isArray(this.userInput)) {
          return [this.userInput[0] || formattedValue && formattedValue[0] || '', this.userInput[1] || formattedValue && formattedValue[1] || ''];
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

        return { ...PICKER_OPTIONS,
          ...this.pickerOptions
        };
      }

    },

    created() {
      this.panel = __vue_component__$1; // vue-popper

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
        const isFormattable = isDateObject(date) || Array.isArray(date) && date.every(isDateObject);

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
        const keyCode = event.keyCode; // ESC, 关闭弹窗

        if (keyCode === 27) {
          this.pickerVisible = false;
          event.stopPropagation();
          return;
        } // Tab, 如果焦点在第一个input，则切换焦点到第二个input


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
        } // Enter


        if (keyCode === 13) {
          if (this.isValidValue(this.parseString(this.displayValue))) {
            // 如果input的值有改变，会在handleStartChange等函数中处理,所以这里直接关闭弹窗即可
            this.pickerVisible = this.picker.visible = false;
            this.blur();
          }

          event.stopPropagation();
          return;
        } // if user is typing, do not let picker handle key input


        if (this.userInput) {
          event.stopPropagation();
          return;
        } // delegate other keys to panel


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
            this.emitInput({
              dateRange: newValue
            });
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
            this.emitInput({
              dateRange: newValue
            });
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
        this.updatePopper(); // 将格式化后的日期格式赋值给picker的value

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
        this.picker.format = this.format; // pickerOptions一般不会改变，如果改变，则需要增加watch

        for (const option in this.options) {
          if (this.options.hasOwnProperty(option)) {
            this.picker[option] = this.options[option];
          }
        } // watch timezone的改变


        const updateTimezone = () => {
          if (this.timezone) {
            this.picker.timezone = this.timezone;
          }
        };

        updateTimezone();
        this.unwatchTimezone = this.$watch('timezone', () => updateTimezone());
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
        if (!val // val=null也需要通知到model
        || // 有改变
        val.shortcut && !(val.shortcut === this.shortcutValue) || val.dateRange && (val.dateRange = this.formatToValue(val.dateRange)) && !valueEquals(val.dateRange, this.dateValue)) {
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
            const res = formatAsFormatAndType(this.getDateRangeByShortcut(shortcuts[i].value), this.valueFormat);

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
            result = [new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)];
            break;

          case '-7d':
            result = [new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7), new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)];
            break;

          case '-1w':
            result = [new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 - day), new Date(today.getFullYear(), today.getMonth(), today.getDate() - day)];
            break;

          case '0m':
            result = [new Date(today.getFullYear(), today.getMonth(), 1), today];
            break;

          case '-1m':
            result = [new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 0)];
            break;
        }

        return result;
      }

    }
  };

  /* script */
  const __vue_script__$2 = script$2;

  /* template */
  var __vue_render__$2 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      {
        directives: [
          {
            name: "clickoutside",
            rawName: "v-clickoutside",
            value: _vm.handleClose,
            expression: "handleClose"
          }
        ],
        ref: "reference",
        staticClass:
          "el-date-editor el-range-editor el-input__inner el-date-editor--daterange",
        class: [
          _vm.pickerSize ? "el-range-editor--" + _vm.pickerSize : "",
          _vm.pickerDisabled ? "is-disabled" : "",
          _vm.pickerVisible ? "is-active" : ""
        ],
        on: {
          click: _vm.handleRangeClick,
          mouseenter: _vm.handleMouseEnter,
          mouseleave: _vm.handleMouseLeave,
          keydown: _vm.handleKeydown
        }
      },
      [
        _c("i", { staticClass: "el-input__icon el-range__icon el-icon-date" }),
        _vm._v(" "),
        _c("input", {
          staticClass: "el-range-input",
          attrs: {
            autocomplete: "off",
            placeholder: _vm.startPlaceholder,
            disabled: _vm.pickerDisabled,
            readonly: !_vm.editable || _vm.readonly,
            name: _vm.name && _vm.name[0]
          },
          domProps: { value: _vm.displayValue && _vm.displayValue[0] },
          on: {
            input: _vm.handleStartInput,
            change: _vm.handleStartChange,
            focus: _vm.handleFocus
          }
        }),
        _vm._v(" "),
        _vm._t("range-separator", [
          _c("span", { staticClass: "el-range-separator" }, [
            _vm._v(_vm._s(_vm.rangeSeparator))
          ])
        ]),
        _vm._v(" "),
        _c("input", {
          staticClass: "el-range-input",
          attrs: {
            autocomplete: "off",
            placeholder: _vm.endPlaceholder,
            disabled: _vm.pickerDisabled,
            readonly: !_vm.editable || _vm.readonly,
            name: _vm.name && _vm.name[1]
          },
          domProps: { value: _vm.displayValue && _vm.displayValue[1] },
          on: {
            input: _vm.handleEndInput,
            change: _vm.handleEndChange,
            focus: _vm.handleFocus
          }
        }),
        _vm._v(" "),
        _c("i", {
          staticClass: "el-input__icon el-range__close-icon",
          class: [_vm.showClose ? "" + _vm.clearIcon : ""],
          on: { click: _vm.handleClickIcon }
        })
      ],
      2
    )
  };
  var __vue_staticRenderFns__$2 = [];
  __vue_render__$2._withStripped = true;

    /* style */
    const __vue_inject_styles__$2 = undefined;
    /* scoped */
    const __vue_scope_id__$2 = undefined;
    /* module identifier */
    const __vue_module_identifier__$2 = undefined;
    /* functional template */
    const __vue_is_functional_template__$2 = false;
    /* style inject */

    /* style inject SSR */

    /* style inject shadow dom */



    const __vue_component__$2 = normalizeComponent(
      { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
      __vue_inject_styles__$2,
      __vue_script__$2,
      __vue_scope_id__$2,
      __vue_is_functional_template__$2,
      __vue_module_identifier__$2,
      false,
      undefined,
      undefined,
      undefined
    );

  return __vue_component__$2;

})));
