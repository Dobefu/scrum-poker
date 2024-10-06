<script setup lang="ts">
const route = useRoute()

const { data, error } = await useAsyncData(`room-${route.params.uuid}`, () =>
  $fetch("/api/v1/get-room", {
    method: "POST",
    body: {
      roomUuid: route.params.uuid,
    },
  }),
)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "The page could not be found",
  })
}

const { getUser } = useAuth()
const user = await getUser()

const cardOptions = [
  "?",
  "∞",
  "0",
  "0.5",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "20",
  "40",
  "100",
]

if (user && import.meta.client) {
  const connection = async (socket: WebSocket, timeout = 10000) => {
    const isOpened = () => socket.readyState === WebSocket.OPEN

    if (socket.readyState !== WebSocket.CONNECTING) {
      return isOpened()
    } else {
      const intrasleep = 100
      const ttl = timeout / intrasleep
      let tries = 0

      while (socket.readyState === WebSocket.CONNECTING && tries < ttl) {
        await new Promise((resolve) => setTimeout(resolve, intrasleep))
        tries++
      }
      return isOpened()
    }
  }
  const wss = new WebSocket(`/api/v1/rooms/${route.params.uuid}`)

  await connection(wss)

  wss.onmessage = async (e) => {
    const response = JSON.parse(await (e.data as Blob).text())
    console.log(response)
  }

  wss.send("join")
}
</script>

<template>
  <template v-if="!user">
    <TypographyHeading type="h1">Poker Room</TypographyHeading>

    <PokerSignupForm />
  </template>

  <template v-else>
    <TypographyHeading type="h1">Poker Room</TypographyHeading>

    <div class="my-8 flex flex-wrap justify-center gap-4">
      <PokerCard
        :value="cardOptions[index]"
        v-for="(option, index) in cardOptions"
      />
    </div>

    <table
      class="mx-auto w-full max-w-2xl border-separate rounded-xl border border-gray-200 bg-white p-2 shadow-md dark:border-gray-950 dark:bg-gray-900"
    >
      <thead>
        <tr>
          <td class="p-4 font-medium">Name</td>
          <td class="p-4 font-medium">Estimate</td>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td class="p-4">{{ user.name }}</td>
          <td class="p-4">-</td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
