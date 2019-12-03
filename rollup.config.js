const vue = require('rollup-plugin-vue');
const buble = require('rollup-plugin-buble');
const { terser } = require('rollup-plugin-terser');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

export default {
  input: 'src/picker/DateRangePicker.js',
  output: {
    file: 'dist/vuen-daterange-picker.js',
    name: 'VueNDaterangePicker',
    format: 'umd',
    globals: {
      vue: 'Vue'
    }
  },
  external: ['vue'],
  plugins: [
    resolve(),
    commonjs(),
    vue({
      compileTemplate: true,
      css: true
    })
    // buble(),
    // terser({
    //   compress: {
    //     global_defs: {
    //       __DEV__: process.env.NODE_ENV !== 'production'
    //     }
    //   }
    // })
  ]
};
