<template>
  <div class="nav-section light w-full px-4 sm:px-[5rem] pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
      <header class="mb-10 sm:mb-16 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          My Profile
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl mx-auto">
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
                    disabled
                    class="w-full bg-zinc-200 border border-zinc-300 rounded-lg px-4 h-11 py-0 leading-[44px] text-zinc-400 text-base focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">
                    Phone Number
                  </label>
                  <div class="relative">
                    <div class="flex items-center bg-theme-input-bg border border-theme-border rounded-lg overflow-hidden focus-within:border-zinc-500 transition-all h-[46px]">
                      <div class="relative shrink-0 h-full flex items-center">
                        <button
                          type="button"
                          class="h-full flex items-center gap-1.5 pl-4 pr-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                          @click.stop="phoneCountryDropdownOpen = !phoneCountryDropdownOpen"
                        >
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-theme-input-bg" aria-hidden="true">
                            <img :src="phoneFlagUrl(selectedPhoneCountry.countryCode)" :alt="selectedPhoneCountry.countryCode" class="w-full h-full object-cover" />
                          </span>
                          <span class="text-[0.875rem]">{{ formatPhoneDialCode(selectedPhoneCountry.dialCode) }} ({{ selectedPhoneCountry.countryCode }})</span>
                          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <input
                        :value="form.phone"
                        required
                        type="tel"
                        maxlength="15"
                        class="flex-1 h-full py-0 pl-4 pr-4 bg-transparent text-[#18181B] focus:outline-none text-base leading-[44px] min-w-0"
                        @input="onProfilePhoneInput"
                        @focus="phoneCountryDropdownOpen = false"
                      />
                    </div>
                    <div
                      v-if="phoneCountryDropdownOpen"
                      class="absolute top-full left-0 mt-1 z-[100] max-h-64 overflow-auto rounded-lg border border-theme-border-strong bg-theme-surface-elevated shadow-xl py-1 min-w-[14rem]"
                    >
                      <button
                        v-for="(country, index) in phoneCountries"
                        :key="index"
                        type="button"
                        class="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-theme-input-bg hover:text-theme-text-primary transition-colors"
                        @click.stop="selectPhoneCountry(country); phoneCountryDropdownOpen = false"
                      >
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-theme-input-bg">
                          <img :src="phoneFlagUrl(country.countryCode)" :alt="country.countryCode" class="w-full h-full object-cover" />
                        </span>
                        <span>{{ formatPhoneDialCode(country.dialCode) }} ({{ country.countryCode }})</span>
                      </button>
                    </div>
                  </div>
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

      </div>
    </div>
</template>

<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'
import { useAuth } from '~/composables/useAuth'
import { phoneCountries, formatPhoneDialCode } from '~/data/phoneCountries'
import { ALLOWED_REASON_FOR_BUYING, type AllowedReasonForBuying } from '~/utils/profileUpdate'

const { user, authLoading } = useAuth()
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitMessageType = ref<'success' | 'error' | ''>('')
const phoneCountryDropdownOpen = ref(false)
const selectedPhoneCountry = ref(
  phoneCountries.find(c => c.countryCode === 'ZA') ?? phoneCountries[0],
)

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
  const rawPhone = (next.phone ?? '').trim()
  const digitsOnly = rawPhone.replace(/\D/g, '')
  const countryMatches = phoneCountries
    .filter(c => digitsOnly.startsWith(c.dialCode))
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
  const matchedCountry = countryMatches[0]

  if (matchedCountry) {
    selectedPhoneCountry.value = matchedCountry
    form.phone = digitsOnly.slice(matchedCountry.dialCode.length)
  } else {
    selectedPhoneCountry.value = phoneCountries.find(c => c.countryCode === 'ZA') ?? phoneCountries[0]
    form.phone = digitsOnly
  }

  if (form.phone.startsWith('0')) {
    form.phone = form.phone.slice(1)
  }

  form.idPassport = next.idPassportNumber ?? ''
  const reason = next.reasonForBuying ?? ''
  form.reasonForBuying = ALLOWED_REASON_FOR_BUYING.includes(reason as AllowedReasonForBuying)
    ? (reason as AllowedReasonForBuying)
    : ''
}, { immediate: true })

let closePhoneDropdownOnClick: (() => void) | null = null
watch(phoneCountryDropdownOpen, (open) => {
  if (closePhoneDropdownOnClick) {
    document.removeEventListener('click', closePhoneDropdownOnClick)
    closePhoneDropdownOnClick = null
  }
  if (open) {
    closePhoneDropdownOnClick = () => {
      phoneCountryDropdownOpen.value = false
      document.removeEventListener('click', closePhoneDropdownOnClick!)
    }
    setTimeout(() => document.addEventListener('click', closePhoneDropdownOnClick!))
  }
})

onBeforeUnmount(() => {
  if (closePhoneDropdownOnClick) {
    document.removeEventListener('click', closePhoneDropdownOnClick)
  }
})

function phoneFlagUrl(countryCode: string) {
  const code = countryCode.toLowerCase()
  return `https://flagcdn.com/w40/${code}.png`
}

function selectPhoneCountry(country: { dialCode: string; countryCode: string }) {
  selectedPhoneCountry.value = country
}

function onProfilePhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  let digits = target.value.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  const currentDialCode = selectedPhoneCountry.value.dialCode
  if (digits.startsWith(currentDialCode)) {
    digits = digits.slice(currentDialCode.length)
  }
  form.phone = digits
}

async function handleUpdateProfile() {
  if (isSubmitting.value || !user.value) return

  submitMessage.value = ''
  submitMessageType.value = ''

  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: `+${selectedPhoneCountry.value.dialCode}${form.phone.trim().replace(/\D/g, '')}`,
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


