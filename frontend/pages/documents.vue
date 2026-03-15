<template>
  <Transition name="page-fade">
  <div class="nav-section light px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-[11rem] pb-16">
    <header class="mb-10 sm:mb-16">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
        Downloads
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

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="doc in developmentDocuments"
        :key="doc.id"
        class="group relative flex flex-col rounded-[0.5rem] px-6 py-6 sm:px-7 sm:py-7 border border-zinc-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <div class="absolute inset-0 rounded-2xl pointer-events-none" />
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-start justify-between mb-6">
            <div>
              <span
                class="inline-flex items-center justify-center w-10 h-10 rounded-[7px] text-[10px] font-black uppercase tracking-[0.18em] bg-[#f4f4f5] text-zinc-500 shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors duration-200 group-hover:bg-[#18181B] group-hover:text-white"
              >
                {{ fileTypeLabel(doc) }}
              </span>
            </div>
            <span
              v-if="doc.fileSize"
              class="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400"
            >
              {{ doc.fileSize }}
            </span>
          </div>

          <h2 class="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight leading-tight mb-2">
            {{ doc.title }}
          </h2>
          <p class="text-[13px] text-zinc-500 leading-relaxed flex-1 mb-6">
            {{ doc.description }}
          </p>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] bg-[#f4f4f5] text-zinc-800 hover:bg-[#18181B] hover:text-white transition-colors w-full"
            @click="handleDownload(doc)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script setup lang="ts">
import type { DocumentEntry } from '~/data/documents'
import { developmentDocuments } from '~/data/documents'

function isExternalUrl(doc: DocumentEntry) {
  const p = doc.filePath
  return p.startsWith('http://') || p.startsWith('https://')
}

function downloadUrl(doc: DocumentEntry) {
  if (isExternalUrl(doc)) return doc.filePath
  if (doc.filePath.startsWith('/')) return doc.filePath
  return `/documents/${encodeURIComponent(doc.filePath)}`
}

async function handleDownload(doc: DocumentEntry) {
  if (isExternalUrl(doc)) {
    await handleExternalDownload(doc)
    return
  }
  const url = downloadUrl(doc)
  const filename = url.split('/').pop() || `${doc.id}.pdf`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function handleExternalDownload(doc: DocumentEntry) {
  const url = doc.filePath
  const filename = url.split('/').pop() || `${doc.id}.pdf`
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`File not available (${res.status})`)
    const blob = await res.blob()
    if (blob.type && !blob.type.includes('pdf') && blob.type.includes('html')) throw new Error('File was not available on site')
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Download failed'
    if (msg.includes('Fetch') || msg.includes('CORS') || msg.includes('Failed to fetch')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      alert(msg)
    }
  }
}

function fileTypeLabel(doc: DocumentEntry) {
  if (doc.fileType) return doc.fileType
  const match = doc.filePath.split('.').pop()?.toLowerCase()
  if (!match) return 'FILE'
  if (match === 'pdf') return 'PDF'
  return match.toUpperCase()
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
