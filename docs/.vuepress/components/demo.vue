<template>

    <div class="demo">
        <div class="py-5">
            <div class="form-group" style="margin-top: 16px;">
              Timezone:
              <select v-model="value">
                <option value="-12:00">-12:00</option>
                <option value="+08:00">+08:00</option>
                <option value="+12:00">+12:00</option>
              </select>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label>Select range: </label>
                <nox-date-range-picker
                    name="abc"
                    v-model="value2"
                    type="daterange"
                    align="right"
                    unlink-panels
                    :clearable=true
                    range-separator="/"
                    @change="changeDate"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    :timezone="value"
                    :picker-options="pickerOptions">
                </nox-date-range-picker>
            </div>
        </div>
    </div>
</template>

<script>
  import NoxDateRangePicker from '../../../src/index.js';
  import 'element-ui/lib/theme-chalk/index.css';

  export default {
    components: { NoxDateRangePicker },
    name: 'demo',
    filters: {
      date (value) {
        if (!value)
          return ''

        let options = {year: 'numeric', month: 'long', day: 'numeric'};
        return Intl.DateTimeFormat('en-US', options).format(value)
      }
    },
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
      }
    },
    methods: {
      changeDate(val) {
        console.log('change Date', val);
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    h1, h2 {
      font-weight: normal;
    }

    a {
      color: #42b983;
    }

    small.form-text {
      display: initial;
    }
    small.form-text::before {
      content: ' - ';
    }

    table {
      border-collapse: collapse;
      margin: 0;
      display: table;
      overflow-x: auto;
    }

    tr {
      border-top: none;
    }
    tr:nth-child(2n) {
      background-color: #fff !important;
    }

    th, td {
      border: none;
      text-align: center !important;
    }
</style>

<style>
    @import "https://unpkg.com/element-ui/lib/theme-chalk/index.css";
</style>
