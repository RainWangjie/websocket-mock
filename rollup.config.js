import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'typescript'
import rollupTypescript from 'rollup-plugin-typescript2'
import replace from 'rollup-plugin-replace'
import sourceMaps from 'rollup-plugin-sourcemaps'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { terser } from 'rollup-plugin-terser'
import builtins from 'rollup-plugin-node-builtins'

const { name, version, author, main, module } = require('./package.json')

// 代码头
const banner = `/*!
 * ${name} v${version} by ${author}
 * (c) 2019-${new Date().getFullYear()} 
 * http://git.tianrang-inc.com:TR-FRONT/ws-mock.git
 * Released under the MIT License.
 */`
const isDev = process.env.NODE_ENV === 'development' ? true : false
const nodeEnv = process.env.NODE_ENV

export default [
  // 组件包
  {
    input: 'index.ts',
    output: [
      {
        file: main,
        format: 'cjs',
        name,
        banner,
        sourcemap: true,
      },
      {
        file: module,
        format: 'es',
        name,
        sourcemap: true,
        banner,
      },
    ],

    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      }),
      peerDepsExternal(),
      nodeResolve(),
      commonjs(),
      builtins(),
      rollupTypescript({
        typescript,
        useTsconfigDeclarationDir: true,
      }),
      !isDev &&
        terser({
          compress: {
            drop_console: false,
          },
        }),
      sourceMaps(),
    ],
  },
]
