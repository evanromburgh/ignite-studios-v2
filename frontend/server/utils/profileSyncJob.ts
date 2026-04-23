export async function enqueueProfileSyncJob(supabase: any, userId: string) {
  return supabase
    .from('zoho_profile_sync_jobs')
    .upsert({
      user_id: userId,
      status: 'pending',
      run_after: new Date().toISOString(),
      attempt_count: 0,
      max_attempts: 8,
      locked_at: null,
      last_error: null,
      payload: {
        source: 'profile-update-api',
      },
    }, {
      onConflict: 'user_id',
    })
}
