import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const staticSource = resolve(root, '.output', 'static')
const publicSource = resolve(root, '.output', 'public')
const source = existsSync(staticSource) ? staticSource : publicSource
const target = resolve(root, 'dist')

rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

if (existsSync(source)) {
  cpSync(source, target, { recursive: true })
}

const sourceLabel = source === staticSource ? '.output/static' : '.output/public'
console.log(`[build] synced ${existsSync(source) ? sourceLabel : '(empty)'} -> dist`)
