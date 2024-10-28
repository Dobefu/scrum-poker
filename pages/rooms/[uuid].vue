<script setup lang="ts">
import type { OffCanvasModal } from "#build/components"
import { type UserData } from "@/types/user-data"
import { twMerge } from "tailwind-merge"

const route = useRoute()
const url = useRequestURL()
const config = useRuntimeConfig()

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

if (!user) {
  useHead({
    title: "Enter poker room",
    meta: [
      {
        name: "description",
        content: "Please enter your name to enter the poker room",
      },
    ],
  })
}

const uuid = ref("")
const userData = reactive<{ value: UserData }>({ value: {} })

const roomName = computed(() => {
  return userData.value.RoomSettings?.Name || "Poker Room"
})

useHead({
  title: roomName,
  meta: [
    {
      name: "description",
      content: "A Scrum Poker room",
    },
  ],
})

const cardOptions = computed(() =>
  userData.value.RoomSettings?.Cards.split(","),
)

const sortedUserData = computed<UserData>(() => {
  let result: UserData = { Users: {} }

  if (!userData.value.Users) return result

  Object.entries(userData.value.Users)
    .toSorted((a, b) => a[1].User.Name.localeCompare(b[1].User.Name))
    .forEach(([key, value]) => (result.Users![key] = value))

  return result
})

const settingsModalRef = ref<typeof OffCanvasModal | undefined>(undefined)
const shareModalRef = ref<typeof OffCanvasModal | undefined>(undefined)

const { copy, copied, isSupported } = useClipboard({ source: url.toString() })

let wss: WebSocket

const reconnect = async () => {
  wss.close()
  console.info("Connection lost. Reconnecting...")

  setTimeout(async () => {
    wss = new WebSocket(`${config.public.wsEndpoint}/${route.params.uuid}`)
    await connection(wss)

    wss.onclose = async () => await reconnect()
    wss.onmessage = async (e) => await onWebsocketMessage(e)

    wss.send(JSON.stringify({ type: "init", data: user?.token }))
  }, 1000)
}

const hasInitialised = ref(false)

const onWebsocketMessage = async (e: MessageEvent) => {
  if (!user) return

  const response = JSON.parse(e.data)

  if ("type" in response && response.type === "init") {
    userData.value = reactive(response.data)

    if (
      !hasInitialised.value &&
      userData.value.RoomSettings?.Owner === user.id
    ) {
      // Open the share dialog if there is no one else.
      if (Object.keys(userData.value.Users ?? []).length <= 1) {
        shareModalRef.value?.open()
        hasInitialised.value = true
      }
    }

    uuid.value = (
      Object.values(userData.value.Users ?? []).find((entry) => {
        return entry.User.ID === user.id
      }) ?? { User: { ID: "" } }
    ).User.ID.toString()

    return
  }

  if ("type" in response && response.type === "join") {
    if (!userData.value?.Users) return

    userData.value.Users[response.user] = response.data
    return
  }

  if ("type" in response && response.type === "leave") {
    if (!userData.value?.Users) return

    delete userData.value.Users[response.data]
    return
  }

  if ("type" in response && response.type === "estimate") {
    if (!userData.value?.Users) return

    if (
      userData.value.Users[response.user].User.ID !== user.id ||
      !response.data
    ) {
      setTimeout(() => {
        if (!userData.value?.Users) return

        userData.value.Users[response.user].Estimate = response.data
      }, 200)

      if (response.data !== "<HIDDEN>") {
        userData.value.Users[response.user].Estimate = response.data
      }
    }

    return
  }

  if (
    "type" in response &&
    response.type === "toggleCardVisibility" &&
    userData.value.RoomSettings
  ) {
    userData.value.RoomSettings.ShowCards =
      !userData.value.RoomSettings.ShowCards
    return
  }

  if (
    "type" in response &&
    response.type === "setRoomName" &&
    userData.value.RoomSettings
  ) {
    userData.value.RoomSettings.Name = response.data
    return
  }

  if (
    "type" in response &&
    response.type === "setCards" &&
    userData.value.RoomSettings
  ) {
    userData.value.RoomSettings.Cards = response.data
    return
  }

  console.log(response)
}

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

  if (isOpened()) console.info("Websocket connected")

  return isOpened()
}

const hasEstimates = computed(() => {
  for (let u of Object.values(userData.value?.Users ?? [])) {
    if (!!u.Estimate) return true
  }

  if (userData.value.RoomSettings?.ShowCards) {
    toggleCardVisibility()
  }

  return false
})

const isAdmin = computed(() => {
  if (!user) return false
  if (!userData.value.RoomSettings) return false

  return (
    "Admins" in userData.value.RoomSettings &&
    (userData.value.RoomSettings.Admins?.includes(user.id) ||
      userData.value.RoomSettings.Owner === user.id)
  )
})

const pickEstimate = async (value: string) => {
  if (!userData.value?.Users) return

  if (userData.value.Users[uuid.value].Estimate === value)
    userData.value.Users[uuid.value].Estimate = ""
  else userData.value.Users[uuid.value].Estimate = value

  await connection(wss)
  wss.send(
    JSON.stringify({
      type: "estimate",
      data: userData.value.Users[uuid.value].Estimate,
    }),
  )
}

const toggleCardVisibility = async () => {
  wss.send(JSON.stringify({ type: "toggleCardVisibility", data: user?.token }))
}

const clearEstimates = async () => {
  wss.send(JSON.stringify({ type: "clearEstimates", data: user?.token }))
}

const settingsFormSubmit = async (e: Event) => {
  const target = e.target as HTMLFormElement

  const name =
    target.querySelector<HTMLInputElement>('[name="name"]')?.value ?? ""
  const cards =
    target.querySelector<HTMLInputElement>('[name="cards"]')?.value ?? ""

  wss.send(
    JSON.stringify({
      type: "updateSettings",
      data: { token: user?.token, name, cards },
    }),
  )

  settingsModalRef.value?.close()
}

if (user && import.meta.client) {
  wss = new WebSocket(`${config.public.wsEndpoint}/${route.params.uuid}`)
  await connection(wss)

  wss.onclose = async () => await reconnect()
  wss.onmessage = async (e) => await onWebsocketMessage(e)

  wss.send(JSON.stringify({ type: "init", data: user.token }))
}
</script>

<template>
  <template v-if="!user">
    <TypographyHeading type="h1">
      {{ roomName }}
    </TypographyHeading>

    <PokerSignupForm />
  </template>

  <template v-else>
    <OffCanvasModal
      class="w-full max-w-2xl"
      ref="settingsModalRef"
    >
      <template #title>Room Settings</template>

      <form
        id="settings-form"
        @submit.prevent="(e) => settingsFormSubmit(e)"
        class="flex flex-col items-stretch justify-center gap-8 dark:text-white"
      >
        <FormInputGroup>
          <FormLabel required>Room name</FormLabel>

          <FormInput
            name="name"
            :value="roomName"
            required
          />
        </FormInputGroup>

        <FormInputGroup>
          <FormLabel>Cards</FormLabel>

          <FormInput
            name="cards"
            :value="userData.value.RoomSettings?.Cards"
          />

          <span class="text-gray-600 dark:text-gray-400">
            A comma separated list of cards to display. Icons can be used by
            prefixing with <code>i:</code>. For example: <code>i:coffee</code>.
            A list of all the usable icons can be found
            <a
              class="text-primary-500 dark:text-primary-400"
              href="https://icon-sets.iconify.design/mdi"
              >here</a
            >.
          </span>
        </FormInputGroup>
      </form>

      <template #actions>
        <FormButton
          class="me-auto"
          variant="primary"
          type="submit"
          form="settings-form"
        >
          <Icon
            name="mdi:floppy"
            ssr
          />

          Save
        </FormButton>
      </template>
    </OffCanvasModal>

    <OffCanvasModal ref="shareModalRef">
      <template #title>Share this room</template>

      <div
        class="flex flex-col items-center justify-center gap-8 dark:text-white"
      >
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
      <TypographyHeading type="h1">
        {{ roomName }}
      </TypographyHeading>

      <div class="flex gap-4">
        <FormButton
          @click="settingsModalRef?.open()"
          v-if="isAdmin"
          title="Open room settings"
          size="square"
        >
          <Icon
            name="mdi:cog"
            ssr
          />
        </FormButton>

        <FormButton
          @click="shareModalRef?.open()"
          title="Share this room"
          size="square"
        >
          <Icon
            name="mdi:qrcode"
            ssr
          />
        </FormButton>
      </div>
    </div>

    <div
      role="listbox"
      aria-label="Cards"
      class="my-4 flex flex-wrap justify-center gap-4"
    >
      <PokerCard
        tabindex="0"
        role="option"
        :title="option.replace(/^i:/, '')"
        :value="option"
        v-for="option in cardOptions"
        @click="() => pickEstimate(option)"
        @keydown.space="() => pickEstimate(option)"
        @keydown.enter="() => pickEstimate(option)"
        :ariaSelected="
          !!option &&
          sortedUserData.Users &&
          sortedUserData.Users[uuid]?.Estimate === option
        "
        class="cursor-pointer"
      />
    </div>

    <div
      class="m-auto mb-4 flex max-w-2xl flex-wrap justify-between gap-4"
      v-if="isAdmin"
    >
      <FormButton
        size="sm"
        class="max-sm:w-full"
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
        class="max-sm:w-full"
        @click="toggleCardVisibility"
        :disabled="!+hasEstimates"
      >
        <template v-if="!userData.value.RoomSettings?.ShowCards">
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
          <td class="p-4 font-medium max-sm:p-2">Name</td>
          <td class="p-4 font-medium max-sm:p-2">Estimate</td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="tableData of sortedUserData.Users">
          <td class="w-full p-4 max-sm:p-2">{{ tableData.User.Name }}</td>
          <td
            class="w-full px-4 max-sm:px-2"
            :style="{
              perspective: '20rem',
            }"
          >
            <PokerCard
              :value="
                tableData.Estimate !== '<HIDDEN>'
                  ? tableData.Estimate || '-'
                  : ''
              "
              type="sm"
              :isHidden="
                !!tableData.Estimate &&
                tableData.User.ID !== user.id &&
                !userData.value.RoomSettings?.ShowCards
              "
            />
          </td>
          <td class="p-4 max-sm:p-2">
            <FormButton
              variant="danger"
              title="Clear estimate"
              @click="pickEstimate('')"
              size="sm"
              :class="
                twMerge(
                  'pointer-events-none scale-0 opacity-0 transition-all max-sm:px-3 max-sm:py-3',
                  [
                    tableData.User.ID === user.id &&
                      !!tableData.Estimate &&
                      'pointer-events-auto scale-100 opacity-100',
                  ],
                )
              "
            >
              <Icon
                name="mdi:do-not-disturb-alt"
                ssr
              />

              <span
                aria-hidden
                class="max-sm:hidden"
                >Clear</span
              >
            </FormButton>
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
