<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"
import { computed } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    type?: "button" | "submit"
    variant?: "primary" | "success" | "warning" | "danger" | "ghost"
    size?: "lg" | "md" | "sm" | "square"
    to?: string
    disabled?: boolean
    loading?: boolean
    icon?: string
  }>(),
  {
    class: undefined,
    type: undefined,
    variant: undefined,
    size: "md",
    to: undefined,
    icon: undefined,
  },
)

const emit = defineEmits<(emit: "click", e: PointerEvent) => void>()

const buttonType = computed(() => {
  if (props.to) return "a"

  return "button"
})

const bgColor = computed(() => {
  switch (props.variant) {
    case "primary":
      return "bg-primary-600 hover:bg-primary-500 active:bg-primary-700 border-primary-500 hover:border-primary-400 active:border-primary-600"
    case "success":
      return "bg-success-500 hover:bg-success-400 active:bg-success-600 border-success-400 hover:border-success-300 active:border-success-500 text-success-950"
    case "warning":
      return "text-warning-900 bg-warning-400 hover:bg-warning-300 active:bg-warning-500 border-warning-300 hover:border-warning-200 active:border-warning-400"
    case "danger":
      return "bg-danger-600 hover:bg-danger-500 active:bg-danger-700 border-danger-500 hover:border-danger-400 active:border-danger-600"
    case "ghost":
      return "text-black dark:text-white bg-transparent hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/20 dark:active:bg-white/20 dark:border-gray-600"
    default:
      return "bg-gray-700 hover:bg-gray-600 active:bg-gray-800 border-gray-600 hover:border-gray-500 active:border-gray-700"
  }
})

const padding = computed(() => {
  switch (props.size) {
    case "lg":
      return "px-8 py-4 rounded-2xl"
    case "sm":
      return "px-4 py-2 rounded-lg"
    case "square":
      return "px-3 py-3 rounded-xl"
    default:
      return "px-6 py-3 rounded-xl"
  }
})
</script>

<template>
  <component
    :is="buttonType"
    :class="
      twMerge(
        'focus:outline-primary-500 inline-flex items-center justify-center gap-2 border font-medium leading-tight text-white shadow outline-offset-4 transition-[background,border,box-shadow,opacity,padding-inline-start] hover:shadow-md active:shadow-none disabled:pointer-events-none disabled:opacity-50',
        bgColor,
        padding,
        props.class,
      )
    "
    :disabled="props.loading || props.disabled"
    :href="to"
    :type="type"
    @click="(e: PointerEvent) => emit('click', e)"
  >
    <Transition
      enter-active-class="transition-[margin,transform,width] delay-100"
      enter-from-class="-me-2 w-0 scale-0"
      enter-to-class="me-0 w-4 scale-100"
      leave-active-class="transition-[margin,transform,width]"
      leave-from-class="me-0 w-4 scale-100"
      leave-to-class="-me-2 w-0 scale-0"
    >
      <span v-if="loading">
        <Icon
          class="size-5 animate-spin"
          data-test-id="button-loading-icon"
          name="mdi:loading"
          ssr
        />
      </span>

      <Icon
        v-else-if="props.icon"
        class="size-5"
        data-test-id="button-icon"
        :name="props.icon"
        ssr
      />
    </Transition>
    <slot />
  </component>
</template>
