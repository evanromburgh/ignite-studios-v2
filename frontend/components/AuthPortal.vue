<template>
  <div class="fixed inset-0 z-[1000] bg-theme-bg flex items-center justify-center px-4 py-6 overflow-y-auto">
    <div class="w-full max-w-[28rem] sm:max-w-md my-auto space-y-6">
      <!-- Above the box: heading + subtext (screenshot 2 structure) -->
      <div v-if="(mode === 'main' && !forgotSuccess) || mode === 'forgot'" class="text-center">
        <template v-if="mode === 'forgot'">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Reset password</h2>
          <p class="mt-2 text-zinc-500 text-sm">Enter your email and we’ll send you a link to reset your password.</p>
        </template>
        <template v-else-if="step === 1">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Sign In or Create Account</h2>
          <p class="mt-2 text-zinc-500 text-sm">Enter your email to get started.</p>
        </template>
        <template v-else-if="step === 2 && accountExists === false">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Create your account</h2>
        </template>
        <template v-else-if="step === 2 && accountExists === true">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Welcome Back</h2>
          <p class="mt-2 text-zinc-500 text-sm">Choose a login method below.</p>
        </template>
        <template v-else-if="step === 3 && signInMethod === 'password'">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Enter your password</h2>
        </template>
        <template v-else-if="step === 3 && signInMethod === 'email_code'">
          <h2 class="text-2xl sm:text-3xl font-black text-theme-text-primary tracking-tight">Check your email</h2>
          <p class="mt-2 text-zinc-500 text-sm">We sent a code to {{ email }}</p>
        </template>
      </div>

      <!-- Card: same as portal (moving border + bg #0b0b0b liquid-glass) -->
      <div class="border-beam-container rounded-2xl shadow-2xl overflow-hidden group">
        <div class="border-beam-inner bg-theme-surface-elevated border-none rounded-[calc(1rem-1px)] p-6 sm:p-10 relative z-10 w-full">

          <!-- Forgot password success -->
          <div v-if="forgotSuccess" class="space-y-6 text-center">
            <p class="text-zinc-400 text-sm">Check your email for a link to reset your password.</p>
            <button
              type="button"
              class="text-sm font-bold text-zinc-300 hover:text-theme-text-primary underline transition-colors"
              @click="forgotSuccess = false; resetToStep1()"
            >
              Back to Sign In
            </button>
          </div>

          <!-- Forgot password form -->
          <form v-else-if="mode === 'forgot'" class="space-y-5" @submit.prevent="handleForgotSubmit">
            <div class="space-y-2">
              <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">Email</label>
              <input
                v-model="email"
                required
                type="email"
                class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 focus:outline-none transition-all"
              />
            </div>
            <div v-if="error" class="text-[10px] font-bold text-red-400 text-center py-2">{{ error }}</div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full h-12 bg-white text-black font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-zinc-100 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <span v-if="loading" class="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span v-else>Send reset link</span>
            </button>
            <button type="button" class="block w-full text-sm text-zinc-500 hover:text-theme-text-primary transition-colors" @click="mode = 'main'; error = null; resetToStep1()">
              Back to Sign In
            </button>
          </form>

          <!-- Main flow: Sign In / Create Account -->
          <template v-else>
            <!-- Single StepIndicator so the bar doesn’t remount; fillStep lags so bar animates after step is visible -->
            <StepIndicator :current-step="step" :fill-step="progressStep" />

            <!-- Step 1 -->
            <template v-if="step === 1">
              <form class="space-y-5 mt-6" @submit.prevent="handleStep1Continue">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">EMAIL ADDRESS</label>
                  <input
                    v-model="email"
                    required
                    type="email"
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">CONFIRM EMAIL</label>
                  <input
                    v-model="confirmEmail"
                    required
                    type="email"
                    class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>
                <div v-if="error" class="text-[10px] font-bold text-red-400 text-center">{{ error }}</div>
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full h-12 bg-white text-black font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-zinc-100 transition-all flex items-center justify-center disabled:opacity-50 mt-6"
                >
                  <span v-if="loading" class="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span v-else>Continue</span>
                </button>
              </form>
            </template>

            <!-- Step 2: Create account -->
            <template v-else-if="step === 2 && accountExists === false">
              <div class="mt-6 rounded-lg bg-theme-input-bg border border-theme-border px-4 py-4 mb-6">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-[0.05em]">CREATING ACCOUNT FOR</p>
                    <p class="text-[13px] font-medium text-theme-text-primary mt-0.5">{{ email }}</p>
                  </div>
                  <button type="button" class="text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors" @click="goBackToStep1">Change</button>
                </div>
              </div>
              <form class="space-y-5" @submit.prevent="handleCreateAccount">
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">FIRST NAME</label>
                    <input
                      v-model="firstName"
                      required
                      type="text"
                      class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">LAST NAME</label>
                    <input
                      v-model="lastName"
                      required
                      type="text"
                      class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-6 h-[46px] py-0 leading-[46px] text-zinc-200 text-base sm:text-[0.875rem] focus:border-zinc-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">PHONE NUMBER</label>
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
                      :value="phone"
                      required
                      type="tel"
                      maxlength="15"
                      class="flex-1 h-full py-0 pl-2 pr-6 bg-transparent text-zinc-200 focus:outline-none text-base sm:text-[0.875rem] leading-[46px] min-w-0"
                      @input="onPhoneInput"
                      @focus="phoneCountryDropdownOpen = false"
                    />
                  </div>
                  <div
                    v-if="phoneCountryDropdownOpen"
                    class="absolute top-full left-0 mt-1 z-[100] max-h-64 overflow-auto rounded-lg border border-theme-border-strong bg-theme-surface-elevated shadow-xl py-1 min-w-[14rem]"
                  >
                    <button
                      v-for="(c, i) in phoneCountries"
                      :key="i"
                      type="button"
                      class="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-theme-input-bg hover:text-theme-text-primary transition-colors"
                      @click.stop="selectPhoneCountry(c); phoneCountryDropdownOpen = false"
                    >
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-theme-input-bg">
                        <img :src="phoneFlagUrl(c.countryCode)" :alt="c.countryCode" class="w-full h-full object-cover" />
                      </span>
                      <span>{{ formatPhoneDialCode(c.dialCode) }} ({{ c.countryCode }})</span>
                    </button>
                  </div>
                </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">CREATE PASSWORD</label>
                  <div class="relative flex items-center bg-theme-input-bg border border-theme-border rounded-lg h-[46px] focus-within:border-zinc-500 transition-all">
                    <input
                      v-model="password"
                      required
                      autocomplete="new-password"
                      :type="showPassword ? 'text' : 'password'"
                      :minlength="passwordMinLength"
                      class="w-full h-full pl-6 pr-12 bg-transparent py-0 leading-[46px] text-zinc-200 focus:outline-none text-base sm:text-[0.875rem] rounded-lg"
                    />
                    <button type="button" class="absolute right-3 text-zinc-500 hover:text-zinc-300 text-xs" @click="showPassword = !showPassword">
                      {{ showPassword ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                  <div v-if="password.length > 0" class="flex items-center gap-2 pt-1">
                    <div class="flex-1 flex gap-1">
                      <div v-for="i in 5" :key="i" class="h-1 flex-1 rounded-full" :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-theme-border'" />
                    </div>
                    <span class="text-[9px] font-black uppercase tracking-widest" :class="passwordStrength.textColor">{{ passwordStrength.label }}</span>
                  </div>
                </div>
                <div v-if="error" class="text-[10px] font-bold text-red-400 text-center">{{ error }}</div>
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full h-12 bg-zinc-100 text-zinc-950 font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-white transition-all flex items-center justify-center disabled:opacity-50"
                >
                  <span v-if="loading" class="w-5 h-5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                  <span v-else>Create Account</span>
                </button>
              </form>
            </template>

            <!-- Step 2: Welcome back (choose method) -->
            <template v-else-if="step === 2 && accountExists === true">
              <div class="mt-6 rounded-lg bg-theme-input-bg border border-theme-border px-4 py-4 mb-6">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-[0.05em]">SIGNING IN AS</p>
                    <p class="text-[13px] font-medium text-theme-text-primary mt-0.5">{{ email }}</p>
                  </div>
                  <button type="button" class="text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors" @click="goBackToStep1">Change</button>
                </div>
              </div>
              <div class="space-y-3">
                <button
                  type="button"
                  class="w-full h-12 bg-white text-black font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-zinc-100 transition-all"
                  @click="handleContinueWithEmailCode"
                >
                  Continue with email code
                </button>
                <button
                  type="button"
                  class="w-full h-12 bg-transparent border border-theme-border-strong text-theme-text-primary font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-theme-input-bg transition-all"
                  @click="signInMethod = 'password'; step = 3"
                >
                  Continue with password
                </button>
              </div>
            </template>

            <!-- Step 3: Enter password -->
            <template v-else-if="step === 3 && signInMethod === 'password'">
              <div class="mt-6 rounded-lg bg-theme-input-bg border border-theme-border px-4 py-4 mb-6">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-[0.05em]">SIGNING IN AS</p>
                    <p class="text-[13px] font-medium text-theme-text-primary mt-0.5">{{ email }}</p>
                  </div>
                  <button type="button" class="text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors" @click="step = 2">Change</button>
                </div>
              </div>
              <form class="space-y-5" @submit.prevent="handleSignInWithPassword">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">PASSWORD</label>
                  <div class="relative flex items-center bg-theme-input-bg border border-theme-border rounded-lg h-[46px] focus-within:border-zinc-500 transition-all">
                    <input
                      v-model="password"
                      required
                      autocomplete="current-password"
                      :type="showPassword ? 'text' : 'password'"
                      class="w-full h-full pl-6 pr-12 bg-transparent py-0 leading-[46px] text-zinc-200 focus:outline-none text-base sm:text-[0.875rem] rounded-lg"
                    />
                    <button type="button" class="absolute right-3 text-zinc-500 hover:text-zinc-300 text-xs" @click="showPassword = !showPassword">
                      {{ showPassword ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                </div>
                <div v-if="error" class="text-[10px] font-bold text-red-400 text-center">{{ error }}</div>
                <div class="flex gap-3">
                  <button type="button" class="flex-1 h-12 bg-theme-input-bg border border-theme-border-strong text-zinc-300 font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-theme-input-bg transition-all" @click="step = 2">Back</button>
                  <button
                    type="submit"
                    :disabled="loading"
                    class="flex-1 h-12 bg-zinc-100 text-zinc-950 font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-white disabled:opacity-50 flex items-center justify-center transition-all"
                  >
                    <span v-if="loading" class="w-5 h-5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                    <span v-else>Sign In</span>
                  </button>
                </div>
              </form>
            </template>

            <!-- Step 3: Email code (Check your email, 8-digit code) -->
            <template v-else-if="step === 3 && signInMethod === 'email_code'">
              <div class="mt-6 rounded-lg bg-theme-input-bg border border-theme-border px-4 py-4 mb-6">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-[0.05em]">SIGNING IN AS</p>
                    <p class="text-[13px] font-medium text-theme-text-primary mt-0.5">{{ email }}</p>
                  </div>
                  <button type="button" class="text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors" @click="step = 2">Change</button>
                </div>
              </div>
              <form class="space-y-6" @submit.prevent="handleVerifyOtp">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] block">ONE-TIME CODE</label>
                  <div class="grid grid-cols-8 gap-2 w-full">
                    <input
                      v-for="(_, i) in OTP_LENGTH"
                      :key="i"
                      :value="otpDigits[i]"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      class="w-full min-w-0 h-12 text-center text-lg font-bold bg-theme-input-bg border border-theme-border rounded-lg text-zinc-200 focus:border-zinc-500 focus:outline-none transition-all"
                      @keydown="onOtpKeydown($event, i)"
                      @input="onOtpSingleInput($event, i)"
                      @paste="onOtpPaste($event)"
                    />
                  </div>
                </div>
                <div v-if="error" class="text-[10px] font-bold text-red-400 text-center">{{ error }}</div>
                <div class="flex gap-3">
                  <button type="button" class="flex-1 h-12 bg-theme-input-bg border border-theme-border-strong text-zinc-300 font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-theme-input-bg transition-all" @click="step = 2">Back</button>
                  <button
                    type="submit"
                    :disabled="loading || otpCode.length !== OTP_LENGTH"
                    class="flex-1 h-12 bg-white text-black font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-zinc-100 disabled:opacity-50 flex items-center justify-center transition-all"
                  >
                    <span v-if="loading" class="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span v-else>Verify</span>
                  </button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </div>

      <!-- Below the box: Forgot Password? and Back to home (stacked underneath one another) -->
      <div v-if="mode === 'main' && step >= 1" class="flex flex-col items-center gap-1">
        <button type="button" class="text-sm text-zinc-500 hover:text-theme-text-primary transition-colors" @click="mode = 'forgot'; resetToStep1()">Forgot Password?</button>
        <NuxtLink to="/" class="text-xs text-zinc-500 hover:text-theme-text-primary transition-colors">Back to home</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { CONFIG } from '~/config'
import StepIndicator from '~/components/auth/StepIndicator.vue'
import { phoneCountries, formatPhoneDialCode } from '~/data/phoneCountries'
const { signUp, login, resetPasswordForEmail, signInWithOtp, verifyOtp, checkEmailExists } = useAuth()

// Supabase email OTP is 8 digits; UI matches that length
const OTP_LENGTH = 8

const mode = ref<'main' | 'forgot'>('main')
const step = ref(1)
const progressStep = ref<1 | 2 | 3>(1) // Bar fill; lags behind step so it animates after new step is visible
const accountExists = ref<boolean | null>(null)
const signInMethod = ref<'password' | 'email_code' | null>(null)

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const confirmEmail = ref('')
const password = ref('')
const phone = ref('')
const phoneCountryDropdownOpen = ref(false)

const selectedPhoneCountry = ref(
  phoneCountries.find(c => c.countryCode === 'ZA') ?? phoneCountries[0]
)

function phoneFlagUrl(countryCode: string) {
  const code = countryCode.toLowerCase()
  return `https://flagcdn.com/w40/${code}.png`
}

function selectPhoneCountry(c: { dialCode: string; countryCode: string }) {
  selectedPhoneCountry.value = c
}

let closeDropdownOnClick: (() => void) | null = null
watch(phoneCountryDropdownOpen, (open) => {
  if (closeDropdownOnClick) {
    document.removeEventListener('click', closeDropdownOnClick)
    closeDropdownOnClick = null
  }
  if (open) {
    closeDropdownOnClick = () => {
      phoneCountryDropdownOpen.value = false
      document.removeEventListener('click', closeDropdownOnClick!)
    }
    setTimeout(() => document.addEventListener('click', closeDropdownOnClick!))
  }
})
onBeforeUnmount(() => {
  if (closeDropdownOnClick) document.removeEventListener('click', closeDropdownOnClick)
})
const error = ref<string | null>(null)
const loading = ref(false)
const showPassword = ref(false)
const forgotSuccess = ref(false)
const otpDigits = ref<string[]>(Array.from({ length: OTP_LENGTH }, () => ''))
const otpCode = computed(() => otpDigits.value.join(''))

const passwordMinLength = CONFIG.PASSWORD_MIN_LENGTH

const passwordStrength = computed(() => {
  const pw = password.value
  let score = 0
  if (pw.length >= CONFIG.PASSWORD_MIN_LENGTH) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
  return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' }
})

function resetToStep1() {
  step.value = 1
  progressStep.value = 1
  accountExists.value = null
  signInMethod.value = null
  error.value = null
  otpDigits.value = Array.from({ length: OTP_LENGTH }, () => '')
}

let progressStepTimeout: ReturnType<typeof setTimeout> | null = null
watch(step, (newStep, oldStep) => {
  if (progressStepTimeout) {
    clearTimeout(progressStepTimeout)
    progressStepTimeout = null
  }
  const next = newStep as 1 | 2 | 3
  if (oldStep !== undefined && newStep > oldStep) {
    // Advancing: show bar move after the new step is already visible
    progressStepTimeout = setTimeout(() => {
      progressStep.value = next
      progressStepTimeout = null
    }, 200)
  } else {
    // Going back or initial: update bar immediately
    progressStep.value = next
  }
})
onBeforeUnmount(() => {
  if (progressStepTimeout) clearTimeout(progressStepTimeout)
})

function goBackToStep1() {
  resetToStep1()
  email.value = ''
  confirmEmail.value = ''
}

function validateEmailStep() {
  error.value = null
  const emailVal = email.value.trim()
  if (!emailVal) {
    error.value = 'Email is required.'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailVal)) {
    error.value = 'Please enter a valid email address.'
    return false
  }
  if (confirmEmail.value.trim() !== emailVal) {
    error.value = 'Emails do not match.'
    return false
  }
  return true
}

async function handleStep1Continue() {
  if (!validateEmailStep()) return
  loading.value = true
  error.value = null
  try {
    console.log('[Auth] Checking email:', email.value.trim())
    const exists = await checkEmailExists(email.value.trim())
    console.log('[Auth] checkEmailExists result:', exists)
    accountExists.value = exists
    step.value = 2
    if (exists) signInMethod.value = null
  } catch (e) {
    console.error('[Auth] checkEmailExists error:', e)
    error.value = 'Something went wrong. Please try again.'
    accountExists.value = false
    step.value = 2
  } finally {
    loading.value = false
  }
}

async function handleContinueWithEmailCode() {
  loading.value = true
  error.value = null
  try {
    await signInWithOtp(email.value.trim())
    signInMethod.value = 'email_code'
    step.value = 3
    otpDigits.value = Array.from({ length: OTP_LENGTH }, () => '')
  } catch (err: any) {
    error.value = err?.message || 'Failed to send code. Try again.'
  } finally {
    loading.value = false
  }
}

async function handleCreateAccount() {
  error.value = null
  if (!firstName.value.trim()) {
    error.value = 'First name is required.'
    return
  }
  if (!lastName.value.trim()) {
    error.value = 'Last name is required.'
    return
  }
  if (password.value.length < passwordMinLength) {
    error.value = `Password must be at least ${passwordMinLength} characters.`
    return
  }
  loading.value = true
  try {
    const fullName = `${firstName.value} ${lastName.value}`.trim()
    const fullPhone = `+${selectedPhoneCountry.value.dialCode}${phone.value}`
    await signUp(email.value, password.value, fullName, firstName.value, lastName.value, fullPhone)
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.message || err?.error?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

async function handleSignInWithPassword() {
  error.value = null
  loading.value = true
  try {
    await login(email.value, password.value)
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.message || err?.error?.message || 'Invalid password.'
  } finally {
    loading.value = false
  }
}

function onOtpSingleInput(e: Event, index: number) {
  const target = e.target as HTMLInputElement
  const char = target.value.replace(/\D/g, '').slice(-1)
  const next = [...otpDigits.value]
  next[index] = char
  otpDigits.value = Array.from({ length: OTP_LENGTH }, (_, i) => next[i] ?? '')
  if (char && index < OTP_LENGTH - 1) (target.nextElementSibling as HTMLInputElement)?.focus()
}

function onOtpKeydown(e: KeyboardEvent, index: number) {
  if (e.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const next = [...otpDigits.value]
    next[index - 1] = ''
    otpDigits.value = Array.from({ length: OTP_LENGTH }, (_, i) => next[i] ?? '')
    const el = (e.target as HTMLElement).previousElementSibling as HTMLInputElement | null
    el?.focus()
  }
}

function onOtpPaste(e: ClipboardEvent) {
  e.preventDefault()
  const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH)
  if (!pasted) return
  const digits = pasted.split('')
  otpDigits.value = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? '')
  const nextIndex = Math.min(digits.length, OTP_LENGTH - 1)
  const container = (e.target as HTMLElement).parentElement
  const inputs = container?.querySelectorAll<HTMLInputElement>('input')
  inputs?.[nextIndex]?.focus()
}

async function handleVerifyOtp() {
  const code = otpCode.value
  if (code.length !== OTP_LENGTH) return
  error.value = null
  loading.value = true
  try {
    await verifyOtp(email.value.trim(), code)
    await navigateTo('/')
  } catch (err: any) {
    error.value = err?.message || err?.error?.message || 'Invalid or expired code.'
  } finally {
    loading.value = false
  }
}

async function handleForgotSubmit() {
  error.value = null
  const emailVal = email.value.trim()
  if (!emailVal) {
    error.value = 'Email is required.'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailVal)) {
    error.value = 'Please enter a valid email address.'
    return
  }
  loading.value = true
  error.value = null
  try {
    await resetPasswordForEmail(emailVal)
    forgotSuccess.value = true
  } catch (err: any) {
    error.value = err?.message || err?.error?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

function onPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  let digits = target.value.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.substring(1)
  // If they typed the selected country's dial code at the start, strip it so we store national number only
  const current = selectedPhoneCountry.value
  if (digits.startsWith(current.dialCode)) {
    phone.value = digits.slice(current.dialCode.length)
  } else {
    phone.value = digits
  }
  // Always remove leading 0 from the national number (after +27)
  if (phone.value.startsWith('0')) {
    phone.value = phone.value.substring(1)
  }
}
</script>
