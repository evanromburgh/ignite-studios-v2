<template>
  <Transition name="page-fade">
    <div class="nav-section light px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
      <header class="mb-10 sm:mb-16">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          My Profile
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl">
          Update the details of your Ignite Studios account.
        </p>
      </header>

      <div v-if="authLoading" class="rounded-xl border border-theme-border bg-theme-surface p-8 sm:p-12 text-center">
        <p class="text-zinc-500 text-base sm:text-lg">
          Loading your profile&hellip;
        </p>
      </div>

      <div
        v-else-if="!user"
        class="rounded-xl border border-theme-border bg-theme-surface p-8 sm:p-12 text-center"
      >
        <p class="text-zinc-500 text-base sm:text-lg mb-4">
          You need to be signed in to view your profile.
        </p>
        <AuthPortal />
      </div>

      <div
        v-else
        class="flex flex-col gap-6 lg:gap-8"
      >
        <section
          class="relative flex flex-col rounded-[0.75rem] px-6 py-6 sm:px-8 sm:py-8 border border-zinc-200 bg-white"
        >
          <form class="space-y-6" @submit.prevent="handleUpdateProfile">
            <fieldset :disabled="isSubmitting" :class="isSubmitting ? 'opacity-80' : ''">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    First Name
                  </label>
                  <input
                    v-model="form.firstName"
                    type="text"
                    required
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 h-11 py-0 leading-[44px] text-[#18181B] text-base focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    Last Name
                  </label>
                  <input
                    v-model="form.lastName"
                    type="text"
                    required
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 h-11 py-0 leading-[44px] text-[#18181B] text-base focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>

                <div class="space-y-2 md:col-span-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    Email Address
                  </label>
                  <input
                    :value="user.email || ''"
                    type="email"
                    readonly
                    class="w-full bg-zinc-100 border border-zinc-200 rounded-lg px-4 h-11 py-0 leading-[44px] text-zinc-600 text-base focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    Phone Number
                  </label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    required
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 h-11 py-0 leading-[44px] text-[#18181B] text-base focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    ID / Passport Number
                  </label>
                  <input
                    v-model="form.idPassport"
                    type="text"
                    required
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 h-11 py-0 leading-[44px] text-[#18181B] text-base focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>

                <div class="space-y-2 md:col-span-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    Reason for Buying
                  </label>
                  <div class="relative">
                    <select
                      v-model="form.reasonForBuying"
                      required
                      class="w-full bg-theme-input-bg border border-theme-border rounded-lg pl-4 pr-10 h-11 pt-[11px] pb-[11px] leading-[1.25] focus:border-zinc-500 focus:outline-none text-[#18181B] text-base transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a reason</option>
                      <option
                        v-for="reason in ALLOWED_REASON_FOR_BUYING"
                        :key="reason"
                        :value="reason"
                      >
                        {{ reason }}
                      </option>
                    </select>
                    <svg
                      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <p
                v-if="submitMessage && submitMessageType === 'success'"
                class="mt-5 text-sm text-emerald-600 font-medium"
              >
                {{ submitMessage }}
              </p>
              <p
                v-if="submitMessage && submitMessageType === 'error'"
                class="mt-5 text-sm text-red-600 font-medium"
              >
                {{ submitMessage }}
              </p>
            </fieldset>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center justify-center h-11 px-9 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] bg-[#18181B] text-white hover:bg-black transition-colors w-full sm:w-auto sm:min-w-[12rem] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isSubmitting"
                  class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"
                />
                <span>Update Profile</span>
              </button>
            </div>
          </form>
        </section>

        <aside>
          <div class="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-4 justify-start max-w-md">
            <button
              type="button"
              class="inline-flex items-center justify-center h-11 px-9 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] bg-[#18181B] text-white hover:bg-black transition-colors w-full sm:w-auto sm:min-w-[10rem] text-center"
              @click="handleSignOut"
            >
              {{ isLoggingOut ? 'Ending Session...' : 'Sign Out' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'
import { useAuth } from '~/composables/useAuth'
import { ALLOWED_REASON_FOR_BUYING, type AllowedReasonForBuying } from '~/utils/profileUpdate'

const { user, authLoading, logout } = useAuth()

const isLoggingOut = ref(false)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitMessageType = ref<'success' | 'error' | ''>('')

const form = reactive<{
  firstName: string
  lastName: string
  phone: string
  idPassport: string
  reasonForBuying: AllowedReasonForBuying | ''
}>({
  firstName: '',
  lastName: '',
  phone: '',
  idPassport: '',
  reasonForBuying: '',
})

watch(user, (next) => {
  if (!next) return
  form.firstName = next.firstName ?? ''
  form.lastName = next.lastName ?? ''
  form.phone = next.phone ?? ''
  form.idPassport = next.idPassportNumber ?? ''
  const reason = next.reasonForBuying ?? ''
  form.reasonForBuying = ALLOWED_REASON_FOR_BUYING.includes(reason as AllowedReasonForBuying)
    ? (reason as AllowedReasonForBuying)
    : ''
}, { immediate: true })

function handleSignOut() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  logout().finally(() => {
    isLoggingOut.value = false
    navigateTo('/')
  })
}

async function handleUpdateProfile() {
  if (isSubmitting.value || !user.value) return

  submitMessage.value = ''
  submitMessageType.value = ''

  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim(),
    idPassport: form.idPassport.trim(),
    reasonForBuying: form.reasonForBuying,
  }

  if (!payload.firstName || !payload.lastName || !payload.phone || !payload.idPassport || !payload.reasonForBuying) {
    submitMessage.value = 'We couldn’t update your profile right now. Please try again.'
    submitMessageType.value = 'error'
    return
  }

  const { data: { session } } = await useNuxtApp().$supabase.auth.getSession()
  if (!session?.access_token) {
    submitMessage.value = 'We couldn’t update your profile right now. Please try again.'
    submitMessageType.value = 'error'
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/profile/update', {
      method: 'POST',
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    user.value = {
      ...user.value,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      idPassportNumber: payload.idPassport,
      reasonForBuying: payload.reasonForBuying,
    }

    submitMessage.value = 'Profile updated successfully.'
    submitMessageType.value = 'success'
  } catch {
    submitMessage.value = 'We couldn’t update your profile right now. Please try again.'
    submitMessageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
.page-fade-enter-to,
.page-fade-leave-from {
  opacity: 1;
}
</style>

