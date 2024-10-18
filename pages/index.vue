<script setup lang="ts">
useHead({
  title: "Create a room",
  meta: [
    {
      name: "description",
      content: "A Scrum Poker room",
    },
  ],
})

const { getUser } = useAuth()
const user = await getUser()

const name = ref("")

const { data: room, error: roomError } = await useAsyncData(
  `user-room-${user?.token}`,
  () =>
    $fetch("/api/v1/get-user-room", {
      method: "POST",
      body: {
        token: user?.token,
      },
    }),
)

const createTmpAccount = async () => {
  const result = await $fetch("/api/v1/create-tmp-account", {
    method: "POST",
    body: {
      name: name.value,
      withRoom: true,
    },
  })

  if (result?.success) {
    navigateTo(`/rooms/${result.room}`, {
      external: true,
    })
  }
}

const createRoom = async () => {
  const result = await $fetch("/api/v1/create-room", {
    method: "POST",
    body: {
      token: user!.token,
    },
  })

  if (result?.success && "room" in result) {
    navigateTo(`/rooms/${result.room}`, {
      external: true,
    })
  }
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

    <div
      v-if="room && !roomError"
      class="flex flex-col items-center gap-8"
    >
      <TypographyHeading type="h3">
        You have an open poker room
      </TypographyHeading>

      <FormButton
        :to="`/rooms/${room.uuid}`"
        variant="primary"
      >
        Enter room
      </FormButton>
    </div>

    <form
      @submit.prevent="createRoom"
      class="flex flex-col items-center gap-8"
      v-else
    >
      <TypographyHeading type="h3">
        You currently don't have a poker room
      </TypographyHeading>

      <FormButton
        type="submit"
        variant="primary"
      >
        Create a room
      </FormButton>
    </form>
  </div>
</template>
