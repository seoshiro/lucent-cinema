import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const [baseArgument, expectedRevision] = process.argv.slice(2)
if (!baseArgument || !/^[a-f0-9]{40}$/.test(expectedRevision || '')) throw new Error('Usage: node scripts/verify-live.mjs https://site/base/ EXACT_COMMIT_SHA')
const base = new URL(baseArgument.endsWith('/') ? baseArgument : baseArgument + '/')
const manifestResponse = await fetch(new URL(`build-manifest.json?revision=${expectedRevision}`, base), {cache:'no-store'})
if(!manifestResponse.ok) throw new Error(`Manifest HTTP ${manifestResponse.status}`)
const manifest = await manifestResponse.json()
if(manifest.revision !== expectedRevision) throw new Error(`Live revision ${manifest.revision} does not match ${expectedRevision}`)
const checks = []
for(const asset of manifest.assets) {
  if(typeof asset.file !== 'string' || asset.file.includes('..') || asset.file.startsWith('/') || asset.file.includes(':')) throw new Error('Invalid relative asset path')
  const response=await fetch(new URL(asset.file,base),{cache:'no-store'})
  if(!response.ok)throw new Error(`${asset.file}: HTTP ${response.status}`)
  const bytes=Buffer.from(await response.arrayBuffer())
  const actualHash=createHash('sha256').update(bytes).digest('hex')
  if(actualHash !== asset.sha256 || bytes.length !== asset.bytes)throw new Error(`${asset.file}: live integrity mismatch`)
  checks.push({file:asset.file,bytes:bytes.length,sha256:actualHash,pass:true})
}
const result={url:base.href,revision:expectedRevision,manifestStatus:manifestResponse.status,assets:checks,pass:true}
writeFileSync('reports/live-integrity.json',JSON.stringify(result,null,2))
console.log(JSON.stringify(result,null,2))
