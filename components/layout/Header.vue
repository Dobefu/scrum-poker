<template>
  <header class="mx-auto w-full max-w-7xl px-4 py-8 max-sm:px-1 max-sm:py-3">
    <div class="rounded-full border border-gray-100 py-4 shadow-md">
      <NuxtLink
        class="flex items-center gap-4 text-lg font-medium text-gray-800"
        to="/"
      >
        <NuxtImg
          src="/logo.svg"
          :height="80"
          :width="80"
          class="-my-8 rounded-full border border-gray-100 bg-white shadow-md"
        />
        {{ $config.public.siteName }}
      </NuxtLink>
    </div>
  </header>
</template>
