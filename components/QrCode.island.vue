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
})
</script>

<template>
  <img
    class="rounded-xl border shadow-md dark:border-gray-800"
    :alt="$props.data"
    :title="$props.data"
    :src="code"
  />
</template>
