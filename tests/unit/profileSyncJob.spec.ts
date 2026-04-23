import { describe, expect, it, vi } from 'vitest'
import { enqueueProfileSyncJob } from '~/server/utils/profileSyncJob'

describe('enqueueProfileSyncJob', () => {
  it('upserts by user_id with latest-wins reset fields', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ upsert })
    const supabase = { from }

    await enqueueProfileSyncJob(supabase, 'user_123')

    expect(from).toHaveBeenCalledWith('zoho_profile_sync_jobs')
    expect(upsert).toHaveBeenCalledTimes(1)

    const [payload, options] = upsert.mock.calls[0]
    expect(payload).toMatchObject({
      user_id: 'user_123',
      status: 'pending',
      attempt_count: 0,
      max_attempts: 8,
      locked_at: null,
      last_error: null,
      payload: {
        source: 'profile-update-api',
      },
    })
    expect(typeof payload.run_after).toBe('string')
    expect(options).toEqual({ onConflict: 'user_id' })
  })
})
