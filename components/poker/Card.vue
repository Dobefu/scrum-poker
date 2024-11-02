<script setup lang="ts">
import { twMerge } from "tailwind-merge"
import type { HTMLAttributes } from "vue"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    value: string
    type?: "md" | "sm"
    isHidden?: boolean
  }>(),
  {
    class: undefined,
    type: "md",
    isHidden: false,
  },
)

const cardClass = computed(() => {
  if (props.type === "sm") return "w-14 max-lg:text-md text-md"

  return "w-24 max-md:w-20 max-md:text-lg text-xl"
})

const value = computed(() => {
  if (!props.value.startsWith("i:")) return props.value
  return props.value.replace(/^i:/, "")
})
</script>

<template>
  <div
    :class="
      twMerge(
        'focus:outline-primary-500 dark:focus:outline-primary-300 dark:focus:aria-checked:outline-primary-300 focus:aria-checked:outline-primary-500 relative inline-block aspect-[2/3] shrink-0 origin-bottom select-none rounded-lg bg-white p-2 align-bottom font-medium text-gray-800 shadow-md outline outline-0 outline-offset-2 outline-gray-100 transition-all focus:outline-2 aria-checked:scale-105 aria-checked:shadow-lg aria-checked:outline-2 aria-checked:outline-gray-300 dark:bg-gray-200 dark:aria-checked:outline-gray-500',
        cardClass,
        $props.class,
      )
    "
    :style="{
      transformStyle: 'preserve-3d',
      transform: props.isHidden ? 'rotateY(180deg)' : '',
    }"
  >
    <template v-if="props.type === 'sm'">
      <div :style="{ backfaceVisibility: 'hidden' }">
        <div
          class="absolute inset-2 rounded-md border border-gray-200 dark:border-gray-400"
        />

        <p
          class="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full leading-none"
        >
          <template v-if="$props.value.startsWith('i:')">
            <Icon
              :name="`mdi:${$props.value.replace(/^i:/, '')}`"
              ssr
            />
          </template>

          <template v-else>
            {{ $props.value.substring(0, 3) }}
          </template>
        </p>
      </div>
    </template>

    <template v-else>
      <div
        class="absolute inset-2 transition-all max-md:inset-1"
        :style="{ backfaceVisibility: 'hidden' }"
      >
        <div
          class="absolute inset-2 rounded-md border border-gray-200 dark:border-gray-400"
        />

        <p
          class="absolute -m-1 rounded-full bg-white p-1 leading-none dark:bg-gray-200"
        >
          <template v-if="$props.value.startsWith('i:')">
            <Icon
              :name="`mdi:${$props.value.replace(/^i:/, '')}`"
              ssr
            />
          </template>

          <template v-else>
            {{ $props.value.substring(0, 3) }}
          </template>
        </p>

        <NuxtImg
          alt=""
          src="/logo.svg"
          :height="80"
          :width="80"
          class="absolute inset-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 transition-all max-lg:h-14 max-lg:w-14"
        />

        <div class="h-full rotate-180 leading-none">
          <p
            class="-m-1 inline-block rounded-full bg-white p-1 leading-none dark:bg-gray-200"
          >
            <template v-if="$props.value.startsWith('i:')">
              <Icon
                :name="`mdi:${$props.value.replace(/^i:/, '')}`"
                ssr
              />
            </template>

            <template v-else>
              {{ $props.value.substring(0, 3) }}
            </template>
          </p>
        </div>
      </div>
    </template>

    <div
      class="absolute inset-0 -z-[1000]"
      :style="{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }"
    >
      <NuxtImg
        alt=""
        src="/logo.svg"
        :height="80"
        :width="80"
        class="absolute inset-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 transition-all"
      />
    </div>
  </div>
</template>
