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
const config = useRuntimeConfig()

const nameInput = ref("")
const roomInput = ref("")
const hasRoomInputError = ref(false)

const { data: room, error: roomError } = await useAsyncData(
  `user-room-${user?.Token}`,
  () =>
    $fetch("/api/v1/get-user-room", {
      method: "POST",
      body: {
        token: user?.Token,
      },
    }),
)

const createTmpAccount = async () => {
  const result = await $fetch("/api/v1/create-tmp-account", {
    method: "POST",
    body: {
      name: nameInput.value,
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
      token: user!.Token,
    },
  })

  if (result?.success && "room" in result) {
    navigateTo(`/rooms/${result.room}`, {
      external: true,
    })
  }
}

const enterRoom = async () => {
  if (!import.meta.client) return

  const roomUuid = roomInput.value.replace(
    `${window.location.origin}/rooms/`,
    "",
  )

  const { data: room } = await useAsyncData<{ UUID: string }>(
    `get-room-${roomUuid}`,
    () => {
      let proto = "http"
      if (config.public.https) proto = "https"

      return $fetch(
        `${proto}://${config.public.backendEndpoint}/get-room/${roomUuid}`,
        {
          method: "GET",
        },
      )
    },
  )

  if (room.value) {
    navigateTo(`/rooms/${roomUuid}`, {
      external: true,
    })

    return
  }

  hasRoomInputError.value = true
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
        type="text"
        name="name"
        placeholder="John Doe"
        v-model="nameInput"
        required
      />
    </FormInputGroup>

    <FormButton
      type="submit"
      variant="primary"
      class="m-auto"
    >
      <Icon
        name="mdi:plus"
        ssr
      />

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
      Hi {{ user.Name }}!
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
        <Icon
          name="mdi:door"
          ssr
        />

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
        <Icon
          name="mdi:plus"
          ssr
        />

        Create a room
      </FormButton>
    </form>
  </div>

  <div
    class="mx-auto my-8 flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-md max-sm:px-4 dark:border-gray-800 dark:bg-gray-900"
  >
    <TypographyHeading
      type="h2"
      class="text-center"
    >
      Enter a room
    </TypographyHeading>

    <form
      @submit.prevent="enterRoom"
      class="flex flex-col items-center gap-8"
    >
      <FormInputGroup class="w-full">
        <FormLabel required>Room ID or URL</FormLabel>

        <FormInput
          autocomplete="off"
          type="search"
          name="room-uuid"
          placeholder=""
          v-model="roomInput"
          @input="hasRoomInputError = false"
          required
        />

        <FormInputError
          v-if="hasRoomInputError"
          message="This room does not exist"
        />
      </FormInputGroup>

      <FormButton
        type="submit"
        variant="primary"
        :disabled="!roomInput || hasRoomInputError"
      >
        <Icon
          name="mdi:door"
          ssr
        />

        Enter room
      </FormButton>
    </form>
  </div>
</template>
