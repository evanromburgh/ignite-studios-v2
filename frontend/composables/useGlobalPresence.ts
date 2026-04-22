/**
 * Site-wide "browsing now" count using Supabase Realtime presence.
 * One channel, no DB writes – scales with high traffic.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const onlineCount = ref(0)
let channel: ReturnType<ReturnType<typeof useNuxtApp>['$supabase']['channel']> | null = null

export function useGlobalPresence() {
  const { $supabase } = useNuxtApp()

  onMounted(() => {
    if (channel) return

    const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36)
    channel = $supabase.channel('site-presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel?.presenceState() ?? {}
        onlineCount.value = Object.keys(state).length
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && channel) {
          await channel.track({ id: sessionId, online_at: Date.now() })
        }
      })
  })

  onBeforeUnmount(() => {
    if (channel) {
      channel.unsubscribe()
      channel = null
    }
    onlineCount.value = 0
  })

  return { onlineCount }
}
