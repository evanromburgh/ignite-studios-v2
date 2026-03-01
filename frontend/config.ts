export const CONFIG = {
  LOCK_DURATION_MS: 10 * 60 * 1000,
  HEARTBEAT_INTERVAL_MS: 15_000,
  PRESENCE_TICK_MS: 10_000,
  PRESENCE_TTL_MS: 12_000,
  /**
   * Viewer count poll interval (ms). 3000 = fewer requests; use 1500 to match old portal exactly.
   * Set to 0 to disable and rely only on Realtime.
   */
  VIEWERS_POLL_MS: 3_000,
  TRANSITION_MID_MS: 600,
  TRANSITION_END_MS: 1200,
  RESERVATION_DEPOSIT: 10_000,
  BOND_RATE: 0.01047,
  RATES_BASE: 850,
  RATES_MULTIPLIER: 0.0005,
  LEVY_PER_SQM: 24,
  PASSWORD_MIN_LENGTH: 8,
  PRICE_FILTER_OPTIONS: [1_500_000, 2_000_000, 3_000_000, 5_000_000, 7_000_000],
} as const
