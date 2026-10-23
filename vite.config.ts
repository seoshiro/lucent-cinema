import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'

function revision() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return 'local-development' }
}

export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __BUILD_REVISION__: JSON.stringify(revision()) },
  build: { target: 'es2022', sourcemap: false },
})
