import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

function revision() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try { return execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim() }
  catch { return 'local-development' }
}
function files(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(join(directory,entry.name)) : [join(directory,entry.name)])
}
const assets = files('dist').filter(path => !path.endsWith('build-manifest.json')).map(path => {
  const bytes=readFileSync(path)
  return {file:relative('dist',path).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}
}).sort((a,b)=>a.file.localeCompare(b.file))
writeFileSync('dist/build-manifest.json',JSON.stringify({revision:revision(),assets},null,2))
console.log(`Manifest: ${assets.length} assets with SHA-256 hashes; revision ${revision()}`)
