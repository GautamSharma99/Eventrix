"use client"

import { useEffect, useRef } from "react"
import { gameActions } from "./use-game-store"
import type { GameEvent } from "@/lib/game-types"

const WS_URL = "ws://localhost:8000/ws"
const RECONNECT_INTERVAL = 3000

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function connect() {
      gameActions.setConnectionStatus("connecting")

      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          gameActions.setConnectionStatus("connected")
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as GameEvent
            if (data.type) {
              gameActions.processEvent(data)
            }
          } catch {
            // Ignore malformed messages
          }
        }

        ws.onclose = () => {
          gameActions.setConnectionStatus("disconnected")
          scheduleReconnect()
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        gameActions.setConnectionStatus("disconnected")
        scheduleReconnect()
      }
    }

    function scheduleReconnect() {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL)
    }

    connect()

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])
}
