<script setup lang="ts">
import type { AppUser } from '~/types'

const props = defineProps<{
  open: boolean
  unitNumber: string
  user: AppUser | null
}>()

const emit = defineEmits<{
  close: []
}>()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  unitNumber: '',
  message: '',
})

watch(
  () => [props.open, props.user, props.unitNumber] as const,
  ([open]) => {
    if (!open) return
    form.firstName = props.user?.firstName ?? ''
    form.lastName = props.user?.lastName ?? ''
    form.email = props.user?.email ?? ''
    form.phone = props.user?.phone ?? ''
    form.unitNumber = props.unitNumber ?? ''
    form.message = ''
  },
  { immediate: true },
)

function closeModal() {
  emit('close')
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).dataset.enquiryBackdrop) {
    closeModal()
  }
}

function submitEnquiry() {
  if (typeof window === 'undefined') return
  const subject = encodeURIComponent(
    form.unitNumber
      ? `Enquiry for Unit ${form.unitNumber}`
      : 'Unit enquiry',
  )
  const body = encodeURIComponent(
    [
      `First Name: ${form.firstName || '-'}`,
      `Last Name: ${form.lastName || '-'}`,
      `Email: ${form.email || '-'}`,
      `Phone: ${form.phone || '-'}`,
      `Unit Number: ${form.unitNumber || '-'}`,
      '',
      'Message:',
      form.message || '-',
    ].join('\n'),
  )
  window.location.href = `mailto:info@ignite-studios.co.za?subject=${subject}&body=${body}`
  closeModal()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="enquiry-modal">
      <div
        v-if="open"
        class="enquiry-overlay"
        data-enquiry-backdrop
        @click="onBackdropClick"
      >
        <div
          class="enquiry-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Enquiry form"
          @click.stop
        >
          <div class="enquiry-header">
            <h2 class="enquiry-title">
              Enquire now
            </h2>
            <button
              type="button"
              class="enquiry-close"
              aria-label="Close"
              @click="closeModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="enquiry-form" @submit.prevent="submitEnquiry">
            <div class="enquiry-grid">
              <label>
                <span>First Name</span>
                <input v-model="form.firstName" type="text">
              </label>
              <label>
                <span>Last Name</span>
                <input v-model="form.lastName" type="text">
              </label>
              <label>
                <span>Email</span>
                <input v-model="form.email" type="email">
              </label>
              <label>
                <span>Phone</span>
                <input v-model="form.phone" type="text">
              </label>
            </div>

            <label class="enquiry-full">
              <span>Unit Number</span>
              <input v-model="form.unitNumber" type="text">
            </label>

            <label class="enquiry-full">
              <span>Message</span>
              <textarea v-model="form.message" rows="5" />
            </label>

            <div class="enquiry-actions">
              <button type="submit" class="enquiry-btn enquiry-btn--primary">
                Submit enquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.enquiry-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.enquiry-modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e4e4e7;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}
.enquiry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e4e4e7;
}
.enquiry-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #18181b;
}
.enquiry-close {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #52525b;
}
.enquiry-close:hover {
  background: #f4f4f5;
  color: #18181b;
}
.enquiry-form {
  padding: 2rem;
}
.enquiry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.enquiry-full {
  display: block;
  margin-top: 0.75rem;
}
label span {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #71717a;
}
input,
textarea {
  width: 100%;
  border: 1px solid #e4e4e7;
  background: #f4f4f5;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  color: #18181b;
}
.enquiry-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
}
.enquiry-btn {
  height: 2.5rem;
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}
.enquiry-btn--ghost {
  border: 1px solid #d4d4d8;
  color: #52525b;
  background: #fff;
}
.enquiry-btn--primary {
  color: #fff;
  background: #18181b;
}

.enquiry-modal-enter-active,
.enquiry-modal-leave-active {
  transition: opacity 0.2s ease;
}
.enquiry-modal-enter-from,
.enquiry-modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .enquiry-header {
    padding: 1rem;
  }

  .enquiry-form {
    padding: 1rem;
  }
}
</style>
