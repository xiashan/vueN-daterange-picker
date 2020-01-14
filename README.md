# vueN-daterange-picker

> VueN date range picker based on https://element.eleme.cn/#/zh-CN/component/installation (no jQuery)

Date range picker component for vue made without jQuery dependency. Heavily inspired by element-ui. 

document: https://xiashan.github.io/vueN-daterange-picker/


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
