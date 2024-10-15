<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import { type HTMLAttributes, computed, useSlots } from "vue"

const props = withDefaults(
  defineProps<{
    align?: "start" | "middle" | "end"
    class?: HTMLAttributes["class"]
    size?: "lg" | "md" | "sm"
    wrapperClass?: HTMLAttributes["class"]
  }>(),
  {
    align: undefined,
    class: undefined,
    size: "md",
    wrapperClass: undefined,
  },
)

const slots = useSlots()

const alignClass = computed(() => {
  switch (props.align) {
    case "middle":
      return "text-center"
    case "end":
      return "text-end"
    default:
      return "text-start"
  }
})

const borderRadius = computed(() => {
  switch (props.size) {
    case "lg":
      return "rounded-2xl"
    case "sm":
      return "rounded-lg"
    default:
      return "rounded-xl"
  }
})

const padding = computed(() => {
  switch (props.size) {
    case "lg":
      return "px-7 py-7"
    case "sm":
      return "px-4 py-4"
    default:
      return "px-6 py-6"
  }
})

const paddingFooterHeader = computed(() => {
  switch (props.size) {
    case "lg":
      return "py-5"
    case "sm":
      return "py-3"
    default:
      return "py-4"
  }
})
</script>

<template>
  <div
    :class="
      twMerge(
        'overflow-hidden border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-950',
        alignClass,
        borderRadius,
        props.wrapperClass,
      )
    "
    data-test-id="wrapper"
  >
    <div
      v-if="slots.header"
      :class="
        twMerge(
          'border-b border-b-gray-200 bg-gray-100 text-gray-600 dark:border-b-gray-800 dark:bg-gray-900 dark:text-gray-200',
          padding,
          paddingFooterHeader,
        )
      "
      data-test-id="header"
    >
      <slot name="header" />
    </div>

    <div
      v-if="slots.default"
      :class="twMerge('flex flex-col gap-8', padding, props.class)"
      data-test-id="body"
    >
      <slot />
    </div>

    <div
      v-if="slots.footer"
      :class="
        twMerge(
          'border-t border-t-gray-200 dark:border-t-gray-800',
          padding,
          paddingFooterHeader,
        )
      "
      data-test-id="footer"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
