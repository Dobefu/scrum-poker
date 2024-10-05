<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    message?: string
  }>(),
  {
    class: undefined,
    message: undefined,
  },
)
</script>

<template>
  <div
    v-show="props.message"
    :class="
      twMerge(
        'text-danger-600 flex items-center gap-1 font-medium',
        props.class,
      )
    "
  >
    <Icon
      class="-mb-0.5"
      name="mdi:error-outline"
      ssr
    />
    <p>{{ props.message }}</p>
  </div>
</template>
