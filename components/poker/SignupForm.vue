<script setup lang="ts">
const name = ref("")

const createTmpAccount = async () => {
  const result = await $fetch("/api/v1/create-tmp-account", {
    method: "POST",
    body: {
      name: name.value,
      withRoom: false,
    },
  })

  if (result?.success) reloadNuxtApp()
}
</script>

<template>
  <form
    class="mx-auto my-8 flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-md max-sm:px-4 dark:border-gray-800 dark:bg-gray-900"
    @submit.prevent="createTmpAccount"
  >
    <TypographyHeading
      type="h2"
      class="text-center"
    >
      Enter poker room
    </TypographyHeading>

    <FormInputGroup>
      <FormLabel required>Your name</FormLabel>

      <FormInput
        autocomplete="name"
        type="text"
        name="name"
        placeholder="John Doe"
        v-model="name"
        required
      />
    </FormInputGroup>

    <FormButton
      type="submit"
      variant="primary"
      class="m-auto"
    >
      Enter the poker room
    </FormButton>
  </form>
</template>
