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
        'relative inline-block h-48 w-32 rounded-lg bg-white p-2 text-2xl font-medium text-gray-800 shadow-md dark:bg-gray-200',
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
      class="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
    />

    <div class="h-full rotate-180 leading-none">
      <p class="-m-1 inline-block bg-white p-1 leading-none dark:bg-gray-200">
        {{ $props.value }}
      </p>
    </div>
  </div>
</template>
