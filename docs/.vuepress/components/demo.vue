<template>
    <div class="demo">

        <div class="py-5">
            <div class="form-group">
                <label>Select range: </label>
                <nox-date-range-picker
                    name="abc"
                    v-model="value2"
                    type="daterange"
                    align="right"
                    unlink-panels
                    range-separator="To"
                    start-placeholder="Start date"
                    end-placeholder="End date">
                    timezone="-7:00"
                </nox-date-range-picker>
            </div>
        </div>
    </div>
</template>

<script>
  import NoxDateRangePicker from '../../../src/picker/DateRangePicker'

  export default {
    components: {NoxDateRangePicker},
    name: 'DateRangePickerDemo',
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
        value1: '',
        value2: ['2019-11-12', '2019-11-15']
      }
    },
    mounted () {
      // this.$refs.picker.open = true
    },
    methods: {
      updateValues (values) {
        console.log('event: update', values)
      },
      checkOpen (open) {
        console.log('event: open', open)
      },
      dateFormat (classes, date) {
        console.log('dateformat');
        return classes
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
    @import "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css";
</style>
