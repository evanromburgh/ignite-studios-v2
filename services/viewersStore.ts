/**
 * Module-level viewer store + DOM event so "Currently viewing" updates on all devices (Desktop).
 * Poll runs here; components subscribe to 'viewers-updated' and re-render with getViewersForUnit().
 */

import { unitService } from './unitService';

let viewersMap: Record<string, Record<string, number>> = {};
let pollIntervalId: ReturnType<typeof setInterval> | null = null;

const EVENT_NAME = 'viewers-updated';

export function getViewersForUnit(unitId: string): Record<string, number> {
  return unitId in viewersMap ? viewersMap[unitId] ?? {} : {};
}

function emitUpdate(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // ignore
  }
}

function sync(): void {
  unitService
    .fetchViewersMap()
    .then((map) => {
      viewersMap = map;
      emitUpdate();
    })
    .catch((err) => console.error('[viewersStore]', err));
}

export function startViewersPoll(userId: string | null): () => void {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  if (!userId) return () => {};

  sync();
  pollIntervalId = setInterval(sync, 1_500);

  const onVisible = (): void => {
    if (document.visibilityState === 'visible') sync();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = null;
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export function subscribeToViewersUpdates(onUpdate: () => void): () => void {
  const handler = () => onUpdate();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
