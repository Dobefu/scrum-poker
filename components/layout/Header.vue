<script setup lang="ts">
const { getUser } = useAuth()
const user = await getUser()

const logout = async () => {
  const result = await $fetch("/api/v1/logout")

  if (result.success) {
    navigateTo("/", {
      external: true,
    })
  }
}
</script>

<template>
  <header
    class="mx-auto w-full max-w-7xl px-4 pb-4 pt-8 max-sm:px-1 max-sm:py-3"
  >
    <div
      class="flex items-center justify-between gap-4 rounded-full border border-gray-100 bg-white py-4 pe-6 shadow-md dark:border-gray-950 dark:bg-gray-900"
    >
      <NuxtLink
        :external="true"
        class="flex items-center gap-4 text-lg font-medium text-gray-800 dark:text-gray-100"
        to="/"
      >
        <NuxtImg
          :alt="`${$config.public.siteName} logo`"
          src="/logo.svg"
          :height="80"
          :width="80"
          class="-my-8 rounded-full bg-white shadow-md"
        />
        {{ $config.public.siteName }}
      </NuxtLink>

      <button
        @click="logout()"
        class="flex items-center gap-2"
        v-if="user?.id"
      >
        <Icon
          name="mdi:logout"
          ssr
        />
        Log out
      </button>
    </div>
  </header>
</template>
