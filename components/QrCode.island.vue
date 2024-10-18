<script setup lang="ts">
import QRCode from "qrcode"

const props = withDefaults(
  defineProps<{
    data: string
  }>(),
  {},
)

const code = await QRCode.toDataURL(props.data, {
  type: "image/jpeg",
  margin: 3,
  errorCorrectionLevel: "H",
  scale: 8,
})
</script>

<template>
  <img
    class="rounded-xl border shadow-md dark:border-gray-800"
    width="206px"
    height="206px"
    :alt="$props.data"
    :title="$props.data"
    :src="code"
  />
</template>
