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
  <div :class="twMerge('inline-block border p-4', $props.class)">
    {{ $props.value }}
  </div>
</template>
