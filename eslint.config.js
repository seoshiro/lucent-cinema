import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.library-transfer/**', 'reference/**', 'test-results/**', 'playwright-report/**', 'screenshots/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  { files: ['**/*.{mjs,js}'], languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly', fetch: 'readonly', Buffer: 'readonly', document: 'readonly', window: 'readonly', location:'readonly', scrollY:'readonly', navigator:'readonly', devicePixelRatio:'readonly', innerWidth:'readonly', innerHeight:'readonly', PerformanceObserver:'readonly', performance:'readonly', requestAnimationFrame:'readonly', HTMLCanvasElement:'readonly', getComputedStyle:'readonly' } } },
)
