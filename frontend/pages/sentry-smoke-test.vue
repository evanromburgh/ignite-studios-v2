<script setup lang="ts">
// Temporary route for validating production Sentry stack traces from real app code.
// Remove this file after verification.
useHead({ title: 'Sentry Smoke Test' })

function triggerFrontendSmokeError(): void {
  throw new Error(`Sentry frontend file smoke test ${Date.now()}`)
}
</script>

<template>
  <main class="smoke-test">
    <h1>Sentry Smoke Test</h1>
    <p>Click the button to throw an app-code error for source map verification.</p>
    <button type="button" @click="triggerFrontendSmokeError">
      Throw Frontend Test Error
    </button>
  </main>
</template>

<style scoped>
.smoke-test {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 1rem;
}

button {
  border: 0;
  border-radius: 0.5rem;
  padding: 0.65rem 1rem;
  cursor: pointer;
  background: #6d4aff;
  color: #fff;
  font-weight: 600;
}
</style>
