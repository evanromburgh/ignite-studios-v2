<template>
  <Transition name="page-fade">
  <div class="nav-section light px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-32 sm:pt-48 pb-24">
    <header class="mb-10 sm:mb-16">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
        Official Documentation
      </h1>
      <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl">
        Comprehensive access to all legal frameworks and site development blueprints.
      </p>
    </header>

    <div v-if="developmentDocuments.length === 0" class="rounded-xl border border-theme-border bg-theme-surface p-8 sm:p-12 text-center">
      <p class="text-zinc-500 text-base sm:text-lg">
        No documents are available for download yet. Development documentation will appear here once added.
      </p>
      <p class="mt-4 text-zinc-600 text-sm">
        To add documents: place PDFs in <code class="px-1.5 py-0.5 rounded bg-theme-input-bg text-zinc-400 font-mono text-xs">public/documents/</code> and add entries to <code class="px-1.5 py-0.5 rounded bg-theme-input-bg text-zinc-400 font-mono text-xs">frontend/data/documents.ts</code>.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      <div
        v-for="doc in developmentDocuments"
        :key="doc.id"
        class="group relative flex flex-col rounded-xl p-6 border border-theme-border bg-theme-surface hover:bg-theme-surface-hover hover:border-theme-border-strong transition-all duration-300"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-theme-input-bg to-transparent pointer-events-none rounded-xl" />
        <div class="relative z-10 flex flex-col h-full">
          <p v-if="doc.category" class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
            {{ doc.category }}
          </p>
          <h2 class="text-lg sm:text-xl font-semibold text-theme-text-primary tracking-tight leading-tight mb-2">
            {{ doc.title }}
          </h2>
          <p class="text-sm text-zinc-500 leading-relaxed flex-1 mb-6">
            {{ doc.description }}
          </p>
          <a
            :href="downloadUrl(doc)"
            download
            class="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg text-[11px] font-black uppercase tracking-normal bg-white text-black hover:bg-zinc-100 transition-colors w-full sm:w-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script setup lang="ts">
import type { DocumentEntry } from '~/data/documents'
import { developmentDocuments } from '~/data/documents'

function downloadUrl(doc: DocumentEntry) {
  const path = doc.filePath.startsWith('/') ? doc.filePath : `/documents/${doc.filePath}`
  return path
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
