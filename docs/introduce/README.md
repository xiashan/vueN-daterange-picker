---
sidebar: auto
sidebarDepth: 2
---

# vueN-daterange-picker

> VueN date range picker based on https://element.eleme.cn/#/zh-CN/component/installation (no jQuery)

Date range picker component for vue made without jQuery dependency. Heavily inspired by element-ui. 


## Installation

```sh
npm i vuen-daterange-picker --save
```

or 

```sh
yarn add vuen-daterange-picker
```

import to use:

```JS
import NoxDateRangePicker from 'vuen-daterange-picker'
```

## Usage

Register the component
```JS
import NoxDateRangePicker from 'vuen-daterange-picker'
import 'element-ui/lib/theme-chalk/index.css'

export default {
  components: { NoxDateRangePicker },

  data () {
    return {
      value: '+08:00',
      value2: {
        dateRange: ['2020-01-01', '2020-01-09'],
        shortcut: '0d', // shortcut优先，解决dateRange动态响应的情况
      },
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        }
      }
    };
  },

  methods: {
    changeDate(val) {
      console.log('change Date', val);
    }
  }
}
```

```vue
    <nox-date-range-picker
      name="date"
      v-model="value2"
      type="daterange"
      align="right"
      unlink-panels
      :clearable=true
      range-separator="To"
      @change="changeDate"
      start-placeholder="Start date"
      end-placeholder="End date"
      :picker-options="pickerOptions">
    </nox-date-range-picker>
```

## Example

<ClientOnly>
<demo />
</ClientOnly>

## Props

| Props               | Type      | Default                                         | Description  |
| --------------------|:----------| ------------------------------------------------|--------------|
| name                | String    |                                                 |   |
| value               | Object    | { dateRange: [], shortcut: '' }                 | shortcut: ['0d', '-1d', '-7d', '-1w', '0m', '', '-1m'] |
| default-value       | Object    |                                                 |   |
| size                | String    |                                                 | same as element input size |
| format              | String    | yyyy-MM-dd                                      |   |
| value-format        | String    | yyyy-MM-dd                                      |   |
| readonly            | Boolean   | false                                           |   |
| disabled            | Boolean   | false                                           |   |
| start-placeholder   | Object    |                                                 |   |
| end-placeholder     | Object    |                                                 |   |
| clearable           | Boolean   | false                                           |   |
| clear-icon          | Object    | el-icon-circle-close                            |   |
| editable            | Boolean   | true                                            |   |
| popper-class        | Object    |                                                 |   |
| align               | Object    | left                                            |   |
| range-separator     | Object    | /                                               |   |
| picker-options      | Object    |                                                 |   |
| timezone            | Object    | +08:00                                          |   |
| unlink-panels       | Boolean   | false                                           | 开始日期和结束日期联动  |


## Events
| Name            | Params                   | Description  |
| ----------------|:-------------------------|--------------|
| input           |                          | click input  |
| blur            |                          | input blur   |
| focus           |                          | input focus  |
| change          |                          | value change |
