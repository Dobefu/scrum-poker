<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import { type HTMLAttributes, computed, onMounted, ref } from "vue"

const props = withDefaults(
  defineProps<{
    autocomplete?: string
    autofocus?: boolean
    class?: HTMLAttributes["class"]
    disabled?: boolean
    formnovalidate?: boolean
    id?: string
    maxlength?: number
    modelValue?: string
    name: string
    placeholder?: string
    required?: boolean
    type?:
      | "email"
      | "number"
      | "password"
      | "search"
      | "tel"
      | "text"
      | "url"
      | "textarea"
  }>(),
  {
    autocomplete: undefined,
    class: undefined,
    type: "text",
    id: undefined,
    maxlength: undefined,
    modelValue: undefined,
    placeholder: undefined,
  },
)

const emit = defineEmits(["update:modelValue"])

const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus() })

onMounted(() => {
  if (input.value?.hasAttribute("autofocus")) {
    input.value?.focus()
  }
})

const componentType = computed(() => {
  switch (props.type) {
    case "textarea":
      return "textarea"
    default:
      return "input"
  }
})
</script>

<template>
  <component
    :is="componentType"
    :id="props.id"
    ref="input"
    :autocomplete="props.autocomplete"
    :autofocus="props.autofocus"
    :class="
      twMerge(
        'rounded-xl border border-gray-300 bg-white px-4 py-3 shadow-inner transition-[background,border,box-shadow,color,opacity,outline] placeholder:text-gray-500 focus:shadow-md disabled:bg-gray-100 disabled:placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:disabled:bg-gray-700 dark:disabled:placeholder:text-gray-500',
        props.class,
      )
    "
    :disabled="props.disabled"
    :formnovalidate="props.formnovalidate"
    :maxlength="props.maxlength"
    :name="props.name"
    :placeholder="props.placeholder"
    :required="props.required"
    :type="componentType === 'input' ? type : undefined"
    :value="props.modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
