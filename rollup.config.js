import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import minify from 'rollup-plugin-minify-es';
import replace from '@rollup/plugin-replace';
import includePaths from 'rollup-plugin-includepaths';


export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    includePaths({ paths: ["./src"] }),
    resolve(),
    commonjs({ include: 'node_modules/**' }),
    postcss({ minimize: true }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    // OR development config
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    (process.env.NODE_ENV === 'production' && minify())
  ],
  onwarn(warning, next) {
    if ( warning.code === 'EVAL' ) return;
    next( warning );
  }
};
