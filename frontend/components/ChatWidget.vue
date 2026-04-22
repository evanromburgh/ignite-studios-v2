<script setup lang="ts">
import type { AgentContact } from '~/types/agent'
import { initialsFromName } from '~/utils/initialsFromName'

const { agents, isConfigured } = useAgentContacts()

const open = ref(false)
const selectedAgentId = ref<string | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  const list = agents.value
  if (list.length === 1) {
    selectedAgentId.value = list[0]!.id
  } else {
    selectedAgentId.value = null
  }
})

const showPicker = computed(
  () => agents.value.length > 1 && selectedAgentId.value === null,
)

const selectedAgent = computed(
  () => agents.value.find(a => a.id === selectedAgentId.value) ?? null,
)

const showBack = computed(
  () => agents.value.length > 1 && selectedAgentId.value !== null,
)

function selectAgent(agent: AgentContact) {
  selectedAgentId.value = agent.id
}

function openModal() {
  open.value = true
}

function closeModal() {
  open.value = false
  selectedAgentId.value = null
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).dataset.chatBackdrop) {
    closeModal()
  }
}

const whatsappNumber = computed(() =>
  selectedAgent.value ? selectedAgent.value.phone.replace(/\D/g, '') : '',
)
const whatsappUrl = computed(
  () => `https://wa.me/${whatsappNumber.value}`,
)
const emailUrl = computed(() =>
  selectedAgent.value ? `mailto:${selectedAgent.value.email}` : 'mailto:',
)
const telUrl = computed(() =>
  selectedAgent.value ? `tel:${selectedAgent.value.phone}` : 'tel:',
)
</script>

<template>
  <div
    v-if="isConfigured"
    class="chat-widget"
    :class="{ 'chat-widget--modal-open': open }"
  >
    <button
      type="button"
      class="chat-widget__button"
      :aria-label="open ? 'Close contact modal' : 'Contact your agent'"
      @click="open ? closeModal() : openModal()"
    >
      <svg
        class="chat-widget__icon"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="chat-modal">
        <div
          v-if="open"
          class="chat-widget__overlay"
          data-chat-backdrop
          @click="onBackdropClick"
        >
          <div
            class="chat-widget__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-modal-title"
            @click.stop
          >
            <div
              class="chat-widget__modal-header"
              :class="{
                'chat-widget__modal-header--picker': showPicker,
              }"
            >
              <div
                v-if="!showPicker"
                class="chat-widget__modal-header-slot chat-widget__modal-header-slot--start"
              >
                <button
                  v-if="showBack"
                  type="button"
                  class="chat-widget__modal-back"
                  aria-label="Back to agent list"
                  @click="selectedAgentId = null"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>
              <h2
                id="chat-modal-title"
                class="chat-widget__modal-title"
                :class="{ 'chat-widget__modal-title--picker': showPicker }"
              >
                Contact your agent
              </h2>
              <div class="chat-widget__modal-header-slot chat-widget__modal-header-slot--end">
                <button
                  type="button"
                  class="chat-widget__modal-close"
                  aria-label="Close"
                  @click="closeModal"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="chat-widget__modal-body">
              <!-- Step 1: pick agent -->
              <div v-if="showPicker" class="chat-widget__pick">
                <ul class="chat-widget__pick-list" role="list">
                  <li v-for="a in agents" :key="a.id">
                    <button
                      type="button"
                      class="chat-widget__pick-item"
                      @click="selectAgent(a)"
                    >
                      <div class="chat-widget__pick-avatar">
                        <img
                          v-if="a.imageUrl"
                          :src="a.imageUrl"
                          :alt="a.name"
                          class="chat-widget__agent-img"
                        >
                        <span v-else class="chat-widget__agent-initials chat-widget__pick-initials">
                          {{ initialsFromName(a.name, 3) }}
                        </span>
                      </div>
                      <div class="chat-widget__pick-text">
                        <span class="chat-widget__pick-name">{{ a.name }}</span>
                        <span class="chat-widget__pick-title">{{ a.title }}</span>
                      </div>
                      <span class="chat-widget__pick-chevron" aria-hidden="true">
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 5l6 6-6 6"
                          />
                        </svg>
                      </span>
                    </button>
                  </li>
                </ul>
              </div>

              <!-- Step 2: contact methods -->
              <template v-else-if="selectedAgent">
                <div class="chat-widget__agent">
                  <div class="chat-widget__agent-avatar">
                    <img
                      v-if="selectedAgent.imageUrl"
                      :src="selectedAgent.imageUrl"
                      :alt="selectedAgent.name"
                      class="chat-widget__agent-img"
                    >
                    <span v-else class="chat-widget__agent-initials">
                      {{ initialsFromName(selectedAgent.name, 3) }}
                    </span>
                  </div>
                  <p class="chat-widget__agent-name">
                    {{ selectedAgent.name }}
                  </p>
                  <div class="chat-widget__agent-details">
                    <a
                      :href="emailUrl"
                      class="chat-widget__agent-detail"
                    >
                      <svg class="chat-widget__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {{ selectedAgent.email }}
                    </a>
                    <a
                      :href="telUrl"
                      class="chat-widget__agent-detail"
                    >
                      <svg class="chat-widget__detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {{ selectedAgent.phone }}
                    </a>
                  </div>
                </div>

                <p class="chat-widget__prompt">
                  Choose your preferred contact method:
                </p>
                <div class="chat-widget__actions">
                  <a
                    :href="whatsappUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="chat-widget__action"
                  >
                    <svg class="chat-widget__action-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    :href="emailUrl"
                    class="chat-widget__action"
                  >
                    <svg class="chat-widget__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email
                  </a>
                  <a
                    :href="telUrl"
                    class="chat-widget__action"
                  >
                    <svg class="chat-widget__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Phone Call
                  </a>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.chat-widget {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 200;
  pointer-events: auto;
}

.chat-widget--modal-open {
  z-index: 3100;
}

.chat-widget__button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #18181b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.35);
  transition: box-shadow 0.2s, background-color 0.2s;
}

.chat-widget__button:hover {
  background-color: #27272a;
  box-shadow: 2px 4px 16px rgba(0, 0, 0, 0.4);
}

.chat-widget__icon {
  width: 22px;
  height: 22px;
  display: block;
  flex-shrink: 0;
  transform: translate(0, 2px);
}

.chat-widget__overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 1.25rem;
  padding-bottom: calc(1.25rem + 56px + 1.25rem);
}

.chat-widget__modal {
  width: 100%;
  max-width: 380px;
  max-height: calc(100vh - 3rem);
  background: var(--theme-surface, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-widget__modal-header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--theme-border, #e4e4e7);
}

/* Picker view: keep 0.75rem top/right/bottom but add left inset for title. */
.chat-widget__modal-header--picker {
  padding-left: 1.25rem;
}

.chat-widget__modal-header-slot {
  display: flex;
  align-items: center;
}

.chat-widget__modal-header-slot--start {
  flex: 0 0 2.25rem;
  justify-content: flex-start;
}

.chat-widget__modal-header-slot--end {
  flex: 0 0 2.25rem;
  justify-content: flex-end;
}

.chat-widget__modal-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text-primary, #18181b);
  text-align: center;
  line-height: 1.25;
}

.chat-widget__modal-title--picker {
  text-align: left;
}

.chat-widget__modal-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-muted, #52525b);
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.chat-widget__modal-back:hover {
  color: var(--theme-text-primary, #18181b);
  background: var(--theme-surface-hover, #fafafa);
}

.chat-widget__modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-muted, #52525b);
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.chat-widget__modal-close:hover {
  color: var(--theme-text-primary, #18181b);
  background: var(--theme-surface-hover, #fafafa);
}

.chat-widget__modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.chat-widget__pick {
  width: 100%;
}

.chat-widget__pick-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-widget__pick-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  border: none;
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-widget__pick-item:hover {
  background: #f4f4f5;
}

.chat-widget__pick-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #18181b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-widget__pick-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1;
  text-align: left;
}

.chat-widget__pick-chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-muted, #52525b);
}

.chat-widget__pick-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme-text-primary, #18181b);
}

.chat-widget__pick-title {
  font-size: 0.75rem;
  color: var(--theme-text-muted, #52525b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-widget__agent {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chat-widget__agent-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #18181b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.chat-widget__agent-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-widget__agent-initials {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.chat-widget__pick-initials {
  font-size: 0.875rem;
}

.chat-widget__agent-name {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text-primary, #18181b);
}

.chat-widget__agent-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.chat-widget__agent-detail {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--theme-text-muted, #52525b);
  text-decoration: none;
  transition: color 0.2s;
}

.chat-widget__agent-detail:hover {
  color: var(--theme-text-primary, #18181b);
}

.chat-widget__detail-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.chat-widget__prompt {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--theme-text-muted, #52525b);
  align-self: center;
  text-align: center;
}

.chat-widget__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.chat-widget__action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  width: 100%;
  max-width: 100%;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--theme-text-primary, #18181b);
  background: var(--theme-surface, #fff);
  border: 1px solid var(--theme-border, #e4e4e7);
  border-radius: 10px;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.chat-widget__action:hover {
  background-color: #18181b;
  color: #ffffff;
  border-color: #18181b;
}

.chat-widget__action-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.chat-modal-enter-active,
.chat-modal-leave-active {
  transition: opacity 0.2s ease;
}

.chat-modal-enter-active .chat-widget__modal,
.chat-modal-leave-active .chat-widget__modal {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.chat-modal-enter-from,
.chat-modal-leave-to {
  opacity: 0;
}

.chat-modal-enter-from .chat-widget__modal,
.chat-modal-leave-to .chat-widget__modal {
  transform: translateY(100%);
}
</style>
