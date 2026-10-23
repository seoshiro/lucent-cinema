import { readFileSync, writeFileSync } from 'node:fs'
const packages = ['react','react-dom','scheduler','three']
const notices = packages.map(name => {
  const metadata = JSON.parse(readFileSync(`node_modules/${name}/package.json`,'utf8'))
  return `${name} ${metadata.version} — ${metadata.license}\n${'='.repeat(64)}\n${readFileSync(`node_modules/${name}/LICENSE`,'utf8')}`
})
writeFileSync('public/third-party-licenses.txt','LUCENT — bundled runtime dependency notices\n\n'+notices.join('\n\n'))
console.log(`Preserved license text for ${packages.join(', ')}`)
