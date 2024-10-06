<template>
  <header class="mx-auto w-full max-w-7xl px-4 py-8 max-sm:px-1 max-sm:py-3">
    <div
      class="rounded-full border border-gray-100 bg-white py-4 shadow-md dark:border-gray-950 dark:bg-gray-900"
    >
      <NuxtLink
        :external="true"
        class="flex items-center gap-4 text-lg font-medium text-gray-800 dark:text-gray-100"
        to="/"
      >
        <NuxtImg
          src="/logo.svg"
          :height="80"
          :width="80"
          class="-my-8 rounded-full bg-white shadow-md"
        />
        {{ $config.public.siteName }}
      </NuxtLink>
    </div>
  </header>
</template>
