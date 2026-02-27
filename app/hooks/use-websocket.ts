"use client"

import { useEffect, useRef } from "react"
import { gameActions } from "./use-game-store"
import type { GameEvent } from "@/lib/game-types"

const BRIDGE_BASE = process.env.NEXT_PUBLIC_BRIDGE_URL ?? "http://localhost:8000"
const WS_BASE = BRIDGE_BASE.replace(/^http/, "ws")
const RECONNECT_INTERVAL = 3000

export function useWebSocket(gameId?: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wsUrl = gameId ? `${WS_BASE}/ws/game/${gameId}` : `${WS_BASE}/ws`

    function connect() {
      gameActions.setConnectionStatus("connecting")

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          gameActions.setConnectionStatus("connected")
        }

        ws.onmessage = (event) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = JSON.parse(event.data) as any
            if (data.type === "PING") return
            const gameEvent = data as GameEvent
            if (gameEvent.type) {
              gameActions.processEvent(gameEvent)
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
  }, [gameId])
}
