<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: "en",
    class: "h-full",
  },
  bodyAttrs: {
    class:
      "min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-800 dark:text-white",
  },
})
</script>

<template>
  <NuxtRouteAnnouncer />

  <a
    href="#main-content"
    class="sr-only focus:not-sr-only"
  >
    Skip to main content
  </a>

  <div class="flex flex-1 flex-col justify-between gap-4">
    <LayoutHeader />

    <main
      class="mx-auto w-full max-w-7xl flex-1 px-8"
      id="main-content"
    >
      <NuxtPage />
    </main>

    <LayoutFooter />
  </div>
</template>
