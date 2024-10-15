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
  margin: 2,
  errorCorrectionLevel: "H",
})
</script>

<template>
  <img
    :alt="$props.data"
    :title="$props.data"
    :src="code"
  />
</template>
