import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { refreshAccessToken } from '../api/refreshTokenService'
import { isTokenExpired } from '../utils/authUtils'

let client = null
const connectedCallbacks = new Set()
const AUTH_KEY = 'auth'
let connectedToken = ''
let connectingToken = ''
let reconnectingAfterAuthRefresh = false

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function resolveWsEndpoint() {
  const apiBaseFromEnv = import.meta.env.VITE_API_BASE_URL
  const fallbackApiBase = `${window.location.protocol}//${window.location.hostname}:8080/api`
  const apiBase = trimTrailingSlash(apiBaseFromEnv || fallbackApiBase)

  const wsBaseFromEnv = trimTrailingSlash(import.meta.env.VITE_WS_BASE_URL || '')
  if (wsBaseFromEnv) {
    return `${wsBaseFromEnv}/ws`
  }

  try {
    const parsedApiUrl = new URL(apiBase)
    return `${parsedApiUrl.origin}/ws`
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:8080/ws`
  }
}

function getAuthToken() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return ''

    const parsed = JSON.parse(raw)
    return parsed?.accessToken || ''
  } catch (e) {
    console.error('getAuthToken error:', e)
    return ''
  }
}

async function getFreshAuthToken() {
  const currentToken = getAuthToken()
  if (!currentToken) return ''

  if (!isTokenExpired(currentToken)) {
    return currentToken
  }

  try {
    return await refreshAccessToken()
  } catch (error) {
    console.error('Failed to refresh token before websocket connect:', error)
    return ''
  }
}

async function refreshAndReconnectOnAuthError() {
  if (reconnectingAfterAuthRefresh) return
  reconnectingAfterAuthRefresh = true

  try {
    const nextToken = await refreshAccessToken()
    if (!nextToken) return

    try {
      client?.deactivate()
    } catch (error) {
      console.error('Failed to deactivate websocket before auth reconnect:', error)
    }

    client = null
    connectedToken = ''
    connectingToken = ''
    connectWs()
  } catch (error) {
    console.error('Refresh token failed after websocket auth error:', error)
  } finally {
    reconnectingAfterAuthRefresh = false
  }
}

export function connectWs(onConnected) {
  if (onConnected) {
    connectedCallbacks.add(onConnected)
  }

  const token = getAuthToken()

  const hasTokenChanged = token && connectedToken && token !== connectedToken
  if (hasTokenChanged && client?.connected) {
    console.info('[WS] Token rotated while connected. Keep current socket, use new token on reconnect.')
  }

  if (client?.connected) {
    console.info('[WS] Reuse connected client')
    if (onConnected) onConnected(client)
    return client
  }

  if (client?.active) {
    console.info('[WS] Client is connecting')
    return client
  }

  client = new Client({
    webSocketFactory: () => new SockJS(resolveWsEndpoint()),
    reconnectDelay: 5000,
    debug: (msg) => {
      if (msg?.includes('ERROR') || msg?.includes('error') || msg?.includes('failed')) {
        console.error('STOMP debug:', msg)
      }
    },
    beforeConnect: async () => {
      const latestToken = await getFreshAuthToken()
      connectingToken = latestToken
      client.connectHeaders = latestToken ? { Authorization: `Bearer ${latestToken}` } : {}
    },
    onConnect: () => {
      connectedToken = connectingToken || getAuthToken()
      console.info('[WS] Connected')

      connectedCallbacks.forEach((cb) => {
        try {
          cb(client)
        } catch (error) {
          console.error('connectWs callback error:', error)
        }
      })
    },
    onWebSocketClose: () => {
      console.info('[WS] Closed')
      connectedToken = ''
      connectingToken = ''
    },
    onWebSocketError: (error) => {
      console.error('WebSocket error:', error)
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame)

      const message = `${frame?.headers?.message || ''} ${frame?.body || ''}`.toLowerCase()
      if (
        message.includes('access denied') ||
        message.includes('unauthorized') ||
        message.includes('authentication') ||
        message.includes('invalid token')
      ) {
        refreshAndReconnectOnAuthError()
      }
    },
    onDisconnect: () => {
      // no-op
    },
  })

  client.activate()
  return client
}

export function disconnectWs() {
  if (client?.active) {
    client.deactivate()
  }
  client = null
  connectedToken = ''
  connectingToken = ''
  connectedCallbacks.clear()
}

export function unregisterWsConnectedCallback(callback) {
  if (!callback) return
  connectedCallbacks.delete(callback)
}

export function subscribeWs(destination, callback) {
  if (!client?.connected) {
    console.warn('[WS SUBSCRIBE SKIPPED] client not connected', { destination })
    return null
  }

  const token = connectedToken || getAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const subscription = client.subscribe(destination, (message) => {
    try {
      const parsed = JSON.parse(message.body)
      console.info('[WS RECEIVE]', {
        destination,
        type: parsed?.type || null,
        conversationId: parsed?.conversationId || null,
        messageId: parsed?.message?.messageId || null,
      })
      callback(parsed)
    } catch (error) {
      console.warn('[WS RECEIVE RAW]', {
        destination,
        body: message?.body,
        parseError: error?.message,
      })
      callback(message.body)
    }
  }, headers)

  console.info('[WS SUBSCRIBED]', { destination })

  return subscription
}

export function publishWs(destination, body) {
  if (!client?.connected) return false
  const token = connectedToken || getAuthToken()
  client.publish({
    destination,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  })
  return true
}

export function getWsClient() {
  return client
}
