import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';

export default {
  input: 'capitalisk-log-in.js',
  output: {
    file: 'dist/capitalisk-log-in.js',
    format: 'es'
  },
  plugins: [
    alias({
      entries: {
        '../ldpos-client/module.js': './node_modules/ldpos-client/module.js'
      }
    }),
    terser()
  ]
};
