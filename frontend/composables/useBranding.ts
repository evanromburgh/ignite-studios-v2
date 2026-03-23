export function useBranding() {
  const { public: pub } = useRuntimeConfig()
  const b = pub.branding
  return {
    faviconUrl: b.faviconUrl,
    logoLightUrl: b.logoLightUrl,
    logoDarkUrl: b.logoDarkUrl,
  }
}
