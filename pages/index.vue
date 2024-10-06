<script setup lang="ts">
const { getUser } = useAuth()
const user = await getUser()

const name = ref("")

const createTmpAccount = async () => {
  if (import.meta.server) return

  const result = await $fetch("/api/v1/create-tmp-account", {
    method: "POST",
    body: {
      name: name.value,
      withRoom: true,
    },
  })

  if (result?.success) navigateTo(`/rooms/${result.room}`)
}
</script>

<template>
  <TypographyHeading type="h1">
    {{ $config.public.siteName }}
  </TypographyHeading>

  <form
    v-if="!user"
    class="mx-auto my-8 flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-md max-sm:px-4 dark:border-gray-800 dark:bg-gray-900"
    @submit.prevent="createTmpAccount"
  >
    <TypographyHeading
      type="h2"
      class="text-center"
    >
      {{ $config.public.siteName }}
    </TypographyHeading>

    <FormInputGroup>
      <FormLabel>Your name</FormLabel>

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
      Create a poker room
    </FormButton>
  </form>

  <div
    v-else
    class="mx-auto my-8 flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-md max-sm:px-4 dark:border-gray-800 dark:bg-gray-900"
  >
    <TypographyHeading
      type="h2"
      class="text-center"
    >
      Hi {{ user.name }}!
    </TypographyHeading>
  </div>
</template>
