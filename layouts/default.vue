<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: "en",
    class: "h-full",
  },
  bodyAttrs: {
    class: "min-h-full flex flex-col",
  },
})
</script>

<template>
  <NuxtRouteAnnouncer />

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
