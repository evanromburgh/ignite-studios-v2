/**
 * Vercel’s “Output Directory: dist” check runs after `nuxt build` for some Nuxt 3 projects, while Nitro writes to
 * `.vercel/output` (vercel preset) or `.output` (e.g. local / forced). A `dist` → `<nitro out>` directory symlink
 * satisfies the check without copying only static (which broke SSR in an earlier attempt).
 * Safe to remove when Vercel no longer enforces a dist path for Nuxt 3.
 */
import { existsSync } from 'node:fs'
import { lstat, readlink, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'

if (process.env.VERCEL !== '1') {
  process.exit(0)
}

const root = process.cwd()
const dist = join(root, 'dist')

const envOut = (process.env.NITRO_OUTPUT_DIR || '').trim().replace(/[\\/]+$/, '').replaceAll('\\', '/')
let target = envOut
if (!target) {
  if (existsSync(join(root, '.vercel', 'output'))) {
    target = '.vercel/output'
  } else {
    target = '.output'
  }
}

try {
  const st = await lstat(dist).catch(() => null)
  if (st) {
    if (st.isSymbolicLink()) {
      const link = await readlink(dist)
      if (link === target || link === join(root, target) || link.replaceAll('\\', '/') === target) {
        process.exit(0)
      }
    }
    await rm(dist, { recursive: true, force: true })
  }
} catch {
  // continue and try to create
}

try {
  await symlink(target, dist, 'dir')
} catch (err) {
  console.error('[vercel-link-dist] could not create dist -> .output symlink:', err)
  process.exit(1)
}
