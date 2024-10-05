<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }>(),
  {
    class: undefined,
  },
)

const classes = {
  h1: "text-4xl",
  h2: "text-3xl",
  h3: "text-2xl",
  h4: "text-xl",
  h5: "text-lg",
  h6: "text-base",
}
</script>

<template>
  <component
    :is="props.type"
    :class="twMerge('font-medium', classes[props.type], props.class)"
  >
    <slot />
  </component>
</template>
