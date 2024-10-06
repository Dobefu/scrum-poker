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
</script>

<template>
  <TypographyHeading type="h1">Poker Room</TypographyHeading>
</template>
