<script setup lang="ts">
import { type UserData } from "@/types/user-data"
import { twMerge } from "tailwind-merge"
import type { rooms } from "~/db/schema"

const route = useRoute()

const { error } = await useAsyncData(`room-${route.params.uuid}`, () =>
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
const roomSettings = reactive<{
  value: (typeof rooms)["$inferSelect"] | undefined
}>({
  value: undefined,
})

const sortedUserData = computed<UserData>(() => {
  let result: UserData = {}

  Object.entries(userData.value)
    .toSorted((a, b) => a[1].user.name.localeCompare(b[1].user.name))
    .forEach(([key, value]) => (result[key] = value))

  return result
})

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
  if (userData.value[uuid.value].estimate === value)
    userData.value[uuid.value].estimate = undefined
  else userData.value[uuid.value].estimate = value

  await connection(wss)
  wss.send(
    JSON.stringify({
      type: "estimate",
      data: userData.value[uuid.value].estimate,
    }),
  )
}

const toggleCardVisibility = async () => {
  wss.send(JSON.stringify({ type: "toggleCardVisibility", data: user?.token }))
}

if (user && import.meta.client) {
  wss = new WebSocket(`/api/v1/rooms/${route.params.uuid}`)
  await connection(wss)

  wss.onmessage = async (e) => {
    let response

    if (process.env.NODE_ENV === "production") response = JSON.parse(e.data)
    else response = JSON.parse(await (e.data as Blob).text())

    if ("type" in response && response.type === "init") {
      userData.value = reactive(response.data)

      uuid.value = (Object.entries(userData.value).find(([_, value]) => {
        return value.user.id === user.id
      }) ?? [""])[0]

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
      if (userData.value[response.user].user.id !== user.id) {
        setTimeout(
          () => (userData.value[response.user].estimate = response.data),
          200,
        )

        if (response.data !== "<HIDDEN>") {
          userData.value[response.user].estimate = response.data
        }
      }

      return
    }

    if ("type" in response && response.type === "roomSettings") {
      roomSettings.value = response.data
      return
    }

    if (
      "type" in response &&
      response.type === "toggleCardVisibility" &&
      roomSettings.value
    ) {
      roomSettings.value.showCards = !roomSettings.value.showCards
      return
    }

    console.log(response)
  }

  wss.send(JSON.stringify({ type: "init", data: user.token }))
}
</script>

<template>
  <template v-if="!user">
    <TypographyHeading type="h1">Poker Room</TypographyHeading>

    <PokerSignupForm />
  </template>

  <template v-else>
    <TypographyHeading type="h1">Poker Room</TypographyHeading>

    <div class="my-4 flex flex-wrap justify-center gap-4">
      <PokerCard
        :value="option"
        v-for="option in cardOptions"
        @click="() => pickEstimate(option)"
        :ariaSelected="sortedUserData[uuid]?.estimate === option"
        class="cursor-pointer"
      />
    </div>

    <div
      class="m-auto mb-4 flex max-w-2xl justify-end"
      v-if="
        roomSettings.value &&
        'admins' in roomSettings.value &&
        (roomSettings.value.admins.includes(user.id) ||
          roomSettings.value.owner === user.id)
      "
    >
      <FormButton @click="toggleCardVisibility">
        <template v-if="!roomSettings.value.showCards">Show cards</template>
        <template v-else>Hide cards</template>
      </FormButton>
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
        <tr v-for="tableData of sortedUserData">
          <td class="w-full p-4">{{ tableData.user.name }}</td>
          <td
            class="w-full px-4"
            :style="{
              perspective: '20rem',
            }"
          >
            <PokerCard
              :value="
                tableData.estimate !== '<HIDDEN>'
                  ? (tableData.estimate ?? '-')
                  : ''
              "
              type="sm"
              :isHidden="
                !!tableData.estimate &&
                tableData.user.id !== user.id &&
                !roomSettings.value?.showCards
              "
            />
          </td>
          <td class="p-4">
            <FormButton
              variant="danger"
              @click="pickEstimate(undefined)"
              size="sm"
              :class="
                twMerge(
                  'pointer-events-none scale-0 opacity-0 transition-all',
                  [
                    tableData.user.id === user.id &&
                      typeof tableData.estimate !== 'undefined' &&
                      'pointer-events-auto scale-100 opacity-100',
                  ],
                )
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
