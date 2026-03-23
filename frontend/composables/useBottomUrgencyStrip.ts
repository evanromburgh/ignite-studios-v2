/** Shared bottom-centre strip (same styling as reserve-page urgency banner). */
export function useBottomUrgencyStrip() {
  const visible = useState('bottomUrgencyStrip.visible', () => false)
  const message = useState('bottomUrgencyStrip.message', () => '')
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function show(text: string) {
    message.value = text
    visible.value = true
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    if (import.meta.client) {
      hideTimer = setTimeout(() => {
        visible.value = false
        hideTimer = null
      }, 5000)
    }
  }

  function dismiss() {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    visible.value = false
  }

  return { visible, message, show, dismiss }
}
