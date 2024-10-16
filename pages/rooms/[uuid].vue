<script setup lang="ts">
import type { OffCanvasModal } from "#build/components"
import { type UserData } from "@/types/user-data"
import { twMerge } from "tailwind-merge"
import type { rooms } from "~/db/schema"

const route = useRoute()
const url = useRequestURL()

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

const modalRef = ref<typeof OffCanvasModal | undefined>(undefined)
const { copy, copied, isSupported } = useClipboard({ source: url.toString() })

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

const hasEstimates = computed(() => {
  for (let u of Object.values(userData.value)) {
    if (!!u.estimate) return true
  }

  return false
})

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

const clearEstimates = async () => {
  wss.send(JSON.stringify({ type: "clearEstimates", data: user?.token }))
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
      if (userData.value[response.user].user.id !== user.id || !response.data) {
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

      if (roomSettings.value?.owner === user.id) {
        // Open the share dialog if there is no one else.
        if (Object.keys(userData.value).length <= 1) modalRef.value?.open()
      }

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
    <OffCanvasModal ref="modalRef">
      <template #title>Share this room</template>

      <div class="flex flex-col items-center justify-center gap-8">
        <QrCode :data="url" />

        <span class="flex w-full flex-wrap items-center justify-center gap-4">
          <p class="break-all text-center">{{ url }}</p>

          <FormButton
            v-if="isSupported"
            aria-label="Copy link to this room"
            @click="copy()"
            :variant="copied ? 'success' : 'ghost'"
            :disabled="copied"
            size="square"
          >
            <Icon
              name="mdi:clipboard"
              ssr
            />
          </FormButton>
        </span>
      </div>
    </OffCanvasModal>

    <div class="flex items-center justify-between">
      <TypographyHeading type="h1">Poker Room</TypographyHeading>

      <FormButton
        @click="modalRef?.open()"
        title="Share this room"
        size="square"
      >
        <Icon
          name="mdi:qrcode"
          ssr
        />
      </FormButton>
    </div>

    <div class="my-4 flex flex-wrap justify-center gap-4">
      <PokerCard
        tabindex="0"
        :value="option"
        v-for="option in cardOptions"
        @click="() => pickEstimate(option)"
        @keydown.space="() => pickEstimate(option)"
        @keydown.enter="() => pickEstimate(option)"
        :ariaSelected="sortedUserData[uuid]?.estimate === option"
        class="cursor-pointer"
      />
    </div>

    <div
      class="m-auto mb-4 flex max-w-2xl justify-between"
      v-if="
        roomSettings.value &&
        'admins' in roomSettings.value &&
        (roomSettings.value.admins.includes(user.id) ||
          roomSettings.value.owner === user.id)
      "
    >
      <FormButton
        size="sm"
        :variant="hasEstimates ? 'danger' : 'ghost'"
        :disabled="!+hasEstimates"
        @click="clearEstimates"
      >
        <Icon
          name="mdi:do-not-disturb-alt"
          ssr
        />

        Clear all estimates
      </FormButton>

      <FormButton
        size="sm"
        @click="toggleCardVisibility"
      >
        <template v-if="!roomSettings.value.showCards">
          <Icon
            name="mdi:cards"
            ssr
          />

          Show cards
        </template>
        <template v-else>
          <Icon
            name="mdi:cards-outline"
            ssr
          />

          Hide cards
        </template>
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
              <Icon
                name="mdi:do-not-disturb-alt"
                ssr
              />

              Clear
            </FormButton>
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
