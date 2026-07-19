import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const temporary = mkdtempSync(join(tmpdir(), 'flowgraph-package-check-'))
const tarballs = join(temporary, 'tarballs')

const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' })

run('pnpm', ['build'])
run('pnpm', ['--filter', '@flowgraph/core', 'pack', '--pack-destination', tarballs])
run('pnpm', ['--filter', '@flowgraph/session', 'pack', '--pack-destination', tarballs])

const archives = readdirSync(tarballs).map((name) => join(tarballs, name))
const coreArchive = archives.find((name) => name.includes('flowgraph-core'))
const sessionArchive = archives.find((name) => name.includes('flowgraph-session'))
if (!coreArchive || !sessionArchive) throw new Error('Expected package archives were not created')

for (const archive of [coreArchive, sessionArchive]) {
  run('pnpm', ['exec', 'publint', archive, '--strict'])
  run('pnpm', ['exec', 'attw', archive, '--profile', 'esm-only'])
}

for (const kind of ['esm', 'typescript']) {
  const consumer = join(temporary, kind)
  cpSync(join(root, 'test', 'consumer', kind), consumer, { recursive: true })
  const manifestPath = join(consumer, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.dependencies['@flowgraph/core'] = `file:${coreArchive}`
  manifest.dependencies['@flowgraph/session'] = `file:${sessionArchive}`
  manifest.pnpm = {
    overrides: {
      '@flowgraph/core': `file:${coreArchive}`,
    },
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  run('pnpm', ['install', '--offline', '--ignore-workspace'], consumer)
  if (kind === 'esm') run('node', ['smoke.mjs'], consumer)
  else run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], consumer)
}
