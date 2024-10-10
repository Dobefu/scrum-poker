export default defineEventHandler(async (event) => {
  setCookie(event, "auth-token", "", {
    expires: new Date(0),
  })

  return {
    success: true,
  }
})
