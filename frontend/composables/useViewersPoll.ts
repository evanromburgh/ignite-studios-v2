/**
 * Stub: per-unit viewers disabled. Global "browsing now" is in useGlobalPresence().
 */
import { ref } from 'vue'

const viewersMap = ref<Record<string, Record<string, number>>>({})

export function subscribeToViewersUpdates(_onUpdate: () => void): () => void {
  return () => {}
}

export function useViewersPoll() {
  return {
    viewersMap,
    getViewersForUnit(_unitId: string): Record<string, number> | null {
      return null
    },
    subscribeToViewersUpdates,
  }
}
