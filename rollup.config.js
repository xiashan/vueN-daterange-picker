const vue = require('rollup-plugin-vue');
import babel from 'rollup-plugin-babel';
const { terser } = require('rollup-plugin-terser');
const resolve = require('rollup-plugin-node-resolve');
// const commonjs = require('rollup-plugin-commonjs');

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: {
    file: isProduction
      ? 'dist/vuen-daterange-picker.min.js'
      : 'dist/vuen-daterange-picker.js',
    format: 'umd',
    name: 'VueNDaterangePicker',
    globals: {
      vue: 'Vue'
    }
  },
  external: ['vue'],
  plugins: [
    resolve({ extensions: ['.vue'] }),
    vue({
      template: {},
      css: true
    }),
    babel({
      runtimeHelpers: true,
      externalHelpers: false
    }),
    isProduction && terser()
  ]
};
