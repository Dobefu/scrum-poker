<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    for?: string
    required?: boolean
  }>(),
  {
    class: undefined,
    for: undefined,
  },
)
</script>

<template>
  <label
    :class="
      twMerge('block font-medium text-gray-800 dark:text-gray-200', props.class)
    "
    :for="props.for"
  >
    <slot />

    <span
      v-if="props.required"
      class="text-danger-500"
      data-test-id="label-required"
    >
      *
    </span>
  </label>
</template>
