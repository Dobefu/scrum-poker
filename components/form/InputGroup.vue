<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
  }>(),
  {
    class: undefined,
  },
)
</script>

<template>
  <div :class="twMerge('flex flex-col gap-2', props.class)">
    <slot />
  </div>
</template>
