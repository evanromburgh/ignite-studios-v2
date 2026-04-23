import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { handleProfileUpdate } from '~/server/api/profile/update.post'

function createProfilesUpdateChain(result: { error: any }) {
  const eq = vi.fn().mockResolvedValue(result)
  const update = vi.fn().mockReturnValue({ eq })
  return { update, eq }
}

describe('/api/profile/update (integration-style)', () => {
  it('returns ok on authenticated happy path', async () => {
    const profileChain = createProfilesUpdateChain({ error: null })
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') return { update: profileChain.update }
        throw new Error(`unexpected table: ${table}`)
      }),
      auth: {
        admin: {
          updateUserById: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    }

    const enqueueProfileSyncJob = vi.fn().mockResolvedValue({ error: null })
    const result = await handleProfileUpdate({} as any, {
      requireAuthenticatedRequest: vi.fn().mockResolvedValue({
        user: {
          id: 'user_123',
          user_metadata: { role: 'user' },
        },
        supabase,
      }),
      parseProfileUpdateInput: vi.fn().mockReturnValue({
        firstName: 'Evan',
        lastName: 'Romburgh',
        phone: '+27745588877',
        idPassport: 'A1234567',
        reasonForBuying: 'Purchasing to Live',
      }),
      enqueueProfileSyncJob,
      readBody: vi.fn().mockResolvedValue({}),
    })

    expect(result).toEqual({ ok: true })
    expect(profileChain.update).toHaveBeenCalledWith({
      first_name: 'Evan',
      last_name: 'Romburgh',
      phone: '+27745588877',
      id_passport_number: 'A1234567',
      reason_for_buying: 'Purchasing to Live',
    })
    expect(profileChain.eq).toHaveBeenCalledWith('id', 'user_123')
    expect(enqueueProfileSyncJob).toHaveBeenCalledWith(supabase, 'user_123')
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('user_123', {
      user_metadata: {
        role: 'user',
        first_name: 'Evan',
        last_name: 'Romburgh',
        phone: '+27745588877',
      },
    })
  })

  it('enforces auth guard by surfacing unauthorized error', async () => {
    await expect(
      handleProfileUpdate({} as any, {
        requireAuthenticatedRequest: vi.fn().mockRejectedValue(
          createError({ statusCode: 401, message: 'Unauthorized' }),
        ),
        parseProfileUpdateInput: vi.fn(),
        enqueueProfileSyncJob: vi.fn(),
        readBody: vi.fn(),
      }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})
