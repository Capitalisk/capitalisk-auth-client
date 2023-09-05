import terser from '@rollup/plugin-terser';

export default {
  input: 'capitalisk-log-in.js',
  output: {
    file: 'dist/capitalisk-log-in.js',
    format: 'es'
  },
  plugins: [
    terser()
  ]
};
