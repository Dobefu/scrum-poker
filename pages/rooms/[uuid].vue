<script setup lang="ts">
import { type UserData } from "@/types/user-data"

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

const uuid = ref("")
const userData = reactive<{ value: UserData }>({ value: {} })
const roomSettings = reactive<{ value: unknown }>({ value: {} })
let wss: WebSocket

const connection = async (socket: WebSocket, timeout = 10000) => {
  const isOpened = () => socket.readyState === WebSocket.OPEN

  if (socket.readyState !== WebSocket.CONNECTING) {
    return isOpened()
  }

  const intrasleep = 100
  const ttl = timeout / intrasleep
  let tries = 0

  while (socket.readyState === WebSocket.CONNECTING && tries < ttl) {
    await new Promise((resolve) => setTimeout(resolve, intrasleep))
    tries++
  }

  return isOpened()
}

const pickEstimate = async (value?: string) => {
  userData.value[uuid.value].estimate = value

  await connection(wss)
  wss.send(JSON.stringify({ type: "estimate", data: value }))
}

if (user && import.meta.client) {
  wss = new WebSocket(`/api/v1/rooms/${route.params.uuid}`)
  await connection(wss)

  wss.onmessage = async (e) => {
    const response = JSON.parse(await (e.data as Blob).text())

    if ("type" in response && response.type === "init") {
      userData.value = reactive(response.data)

      uuid.value = Object.entries(userData.value).find(([key, value]) => {
        return value.user.id === user.id
      })[0]

      return
    }

    if ("type" in response && response.type === "join") {
      userData.value[response.user] = response.data
      return
    }

    if ("type" in response && response.type === "leave") {
      delete userData.value[response.data]
      return
    }

    if ("type" in response && response.type === "estimate") {
      userData.value[response.user].estimate = response.data
      return
    }

    if ("type" in response && response.type === "roomSettings") {
      roomSettings.value = response.data
      return
    }

    console.log(response)
  }

  wss.send(JSON.stringify({ type: "init", data: user }))
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
        :value="option"
        v-for="option in cardOptions"
        @click="() => pickEstimate(option)"
        class="cursor-pointer"
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
        <tr v-for="tableData of userData.value">
          <td class="w-full p-4">{{ tableData.user.name }}</td>
          <td class="w-full p-4">{{ tableData.estimate ?? "-" }}</td>
          <td class="p-4">
            <FormButton
              variant="danger"
              @click="pickEstimate(undefined)"
              size="sm"
              v-if="
                tableData.user.id === user.id &&
                typeof tableData.estimate !== 'undefined'
              "
            >
              Clear&nbsp;estimate
            </FormButton>
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
