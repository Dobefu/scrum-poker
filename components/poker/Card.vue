<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    value: string
  }>(),
  {
    class: undefined,
  },
)
</script>

<template>
  <div
    :class="
      twMerge(
        'relative inline-block h-48 w-32 shrink-0 origin-bottom select-none rounded-lg bg-white p-2 text-2xl font-medium text-gray-800 shadow-md transition-all aria-selected:scale-105 max-lg:h-36 max-lg:w-24 max-lg:text-xl dark:bg-gray-200',
        $props.class,
      )
    "
  >
    <div
      class="absolute inset-4 rounded-md border border-gray-200 dark:border-gray-400"
    />

    <p class="absolute -m-1 bg-white p-1 leading-none dark:bg-gray-200">
      {{ $props.value }}
    </p>

    <NuxtImg
      src="/logo.svg"
      :height="80"
      :width="80"
      class="absolute inset-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 transition-all max-lg:h-14 max-lg:w-14"
    />

    <div class="h-full rotate-180 leading-none">
      <p class="-m-1 inline-block bg-white p-1 leading-none dark:bg-gray-200">
        {{ $props.value }}
      </p>
    </div>
  </div>
</template>
