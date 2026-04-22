/**
 * Resolves `#internal/nuxt/paths` when Node loads `.nuxt/dist/server/server.mjs` (e.g. error overlay / tooling).
 * Nuxt normally keeps the real module in a virtual FS only; the on-disk `paths.mjs` template imports `#internal/nitro`,
 * which cannot run outside Nitro. This stub mirrors the path helpers with defaults from `app.baseURL` / `buildAssetsDir`.
 */
import { joinRelativeURL } from 'ufo'

const app = {
  baseURL: '/',
  buildAssetsDir: '/_nuxt/',
  cdnURL: '',
}

const getAppConfig = () => app

export const baseURL = () => getAppConfig().baseURL
export const buildAssetsDir = () => getAppConfig().buildAssetsDir
export const buildAssetsURL = (...path) => joinRelativeURL(publicAssetsURL(), buildAssetsDir(), ...path)
export const publicAssetsURL = (...path) => {
  const appConfig = getAppConfig()
  const publicBase = appConfig.cdnURL || appConfig.baseURL
  return path.length ? joinRelativeURL(publicBase, ...path) : publicBase
}
