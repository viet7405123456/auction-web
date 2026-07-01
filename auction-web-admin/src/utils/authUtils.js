export const isTokenExpired = (token) => {
  const payload = parseJwt(token)

  if (!payload?.exp) return true

  return payload.exp * 1000 <= Date.now()
}

const parseJwt = (token) => {
  try {
    if (!token) return null

    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}