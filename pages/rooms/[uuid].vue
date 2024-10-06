<script setup lang="ts">
const { getUser } = useAuth()
const user = await getUser()

if (!user) {
  throw createError({
    statusCode: 404,
    statusMessage: "The page could not be found",
  })
}

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
</script>

<template>
  <TypographyHeading type="h1">Poker Room</TypographyHeading>

  <div class="my-8 flex flex-wrap justify-center gap-4">
    <PokerCard
      :value="cardOptions[index]"
      v-for="(option, index) in cardOptions"
    />
  </div>
</template>
