"use client"

import { useEffect, useRef, useState } from "react"
import { useGameStore } from "@/hooks/use-game-store"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Skull,
  Users,
  Vote,
  LogOut,
  Trophy,
  Play,
  Radio,
  Tv,
  ArrowRight,
  ShieldAlert,
  Crown,
  Handshake,
  type LucideIcon,
} from "lucide-react"
import type { GameEventType } from "@/lib/game-types"

const eventIcons: Record<GameEventType, LucideIcon> = {
  GAME_START: Play,
  KILL: Skull,
  MEETING_START: Users,
  VOTE: Vote,
  EJECTION: LogOut,
  GAME_END: Trophy,
  // Chess
  MOVE: ArrowRight,
  CHECK: ShieldAlert,
  CHECKMATE: Crown,
  STALEMATE: Handshake,
}

const eventColors: Record<GameEventType, string> = {
  GAME_START: "text-primary",
  KILL: "text-destructive",
  MEETING_START: "text-accent",
  VOTE: "text-muted-foreground",
  EJECTION: "text-accent",
  GAME_END: "text-primary",
  // Chess
  MOVE: "text-blue-400",
  CHECK: "text-orange-400",
  CHECKMATE: "text-yellow-400",
  STALEMATE: "text-muted-foreground",
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const phaseLabels: Record<string, string> = {
  waiting: "STANDBY",
  running: "LIVE",
  meeting: "MEETING",
  ended: "ENDED",
}

// ---------------------------------------------------------------------------
// LiveStream — renders the actual game video feed from FRAME events
// ---------------------------------------------------------------------------

const BRIDGE_WS = (process.env.NEXT_PUBLIC_BRIDGE_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws")

function LiveStream({ gameId }: { gameId?: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const prevUrlRef = useRef<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!gameId) return

    // Dedicated binary video channel — no base64, no JSON parsing
    const url = `${BRIDGE_WS}/ws/video/${gameId}`

    function connect() {
      const ws = new WebSocket(url)
      ws.binaryType = "arraybuffer"  // Raw bytes, fastest option
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (ev) => {
        if (ev.data instanceof ArrayBuffer) {
          const blob = new Blob([ev.data], { type: "image/jpeg" })
          const objUrl = URL.createObjectURL(blob)
          if (imgRef.current) imgRef.current.src = objUrl
          // Revoke previous URL after new one is set
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
          prevUrlRef.current = objUrl
        }
        // Ignore text PING frames
      }

      ws.onclose = () => {
        setConnected(false)
        setTimeout(connect, 1500)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      wsRef.current?.close()
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [gameId])

  if (!gameId) return null

  return (
    <div className="absolute inset-0 bg-black">
      {/* Live game video */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt="Live game stream"
        className="w-full h-full object-contain"
        style={{ imageRendering: "auto" }}
      />

      {/* LIVE badge */}
      {connected && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/70 backdrop-blur-sm border border-destructive/50 px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-destructive tracking-wider">
            LIVE
          </span>
        </div>
      )}

      {/* Connecting overlay */}
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Tv className="size-12 opacity-40 animate-pulse" />
            <p className="font-mono text-xs tracking-wider">CONNECTING TO LIVE STREAM...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StreamPlayer — main export
// ---------------------------------------------------------------------------

export function StreamPlayer({ gameId }: { gameId?: string }) {
  const { phase, feed, agents } = useGameStore()
  const alive = agents.filter((a) => a.alive)
  const hasLiveStream = !!gameId

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      {/* ---- Video area ---- */}
      {hasLiveStream ? (
        /* Real Pygame stream */
        <LiveStream gameId={gameId} />
      ) : (
        /* Demo / waiting placeholder */
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
          {phase === "waiting" ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Tv className="size-16 opacity-30 animate-pulse" />
              <p className="font-mono text-sm tracking-wider">WAITING FOR STREAM...</p>
              <p className="font-mono text-xs opacity-50">Run a demo or start a game</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-background/40 to-secondary/60">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `
                  linear-gradient(rgba(61, 216, 224, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(61, 216, 224, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }} />
            </div>
          )}
        </div>
      )}

      {/* ---- Phase + agent dots overlay (demo mode only) ---- */}
      {!hasLiveStream && phase !== "waiting" && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 px-3 py-1.5">
            {phase === "running" && (
              <span className="size-2 rounded-full bg-destructive animate-pulse" />
            )}
            <Radio className="size-3.5 text-primary" />
            <span className="font-mono text-xs font-bold text-foreground tracking-wider">
              {phaseLabels[phase]}
            </span>
            <span className="text-xs text-muted-foreground font-mono ml-2">
              {alive.length}/{agents.length}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-background/60 backdrop-blur-sm border border-border/50 px-2 py-1.5">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="relative group"
                title={`${agent.name} ${agent.alive ? "" : "(dead)"}`}
              >
                <div
                  className={`size-5 rounded-full border-2 transition-all flex items-center justify-center text-[7px] font-bold font-mono ${agent.alive ? "" : "opacity-30"
                    }`}
                  style={{
                    backgroundColor: agent.alive ? agent.color + "40" : "transparent",
                    borderColor: agent.alive ? agent.color : "var(--border)",
                    color: agent.alive ? agent.color : "var(--muted-foreground)",
                  }}
                >
                  {agent.name.slice(0, 1)}
                </div>
                {!agent.alive && (
                  <Skull className="absolute -top-1 -right-1 size-2.5 text-destructive" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Live event feed (always visible on right) ---- */}
      {feed.length > 0 && (
        <div className="absolute top-3 right-3 bottom-3 w-[260px] z-10 flex flex-col rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-foreground tracking-wider uppercase">
              Live Feed
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              {feed.length}
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
              {feed.slice(0, 30).map((item, i) => {
                const Icon = eventIcons[item.type]
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2 rounded px-2 py-1.5 ${i === 0 ? "animate-in slide-in-from-top-2 fade-in duration-300 bg-card/80" : "bg-transparent"
                      }`}
                  >
                    <Icon className={`mt-0.5 size-3 shrink-0 ${eventColors[item.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                        {item.message}
                      </p>
                      {item.details && (
                        <p className="text-[10px] text-muted-foreground truncate">{item.details}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[9px] text-muted-foreground/60 font-mono tabular-nums mt-0.5">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ---- Winner banner ---- */}
      {phase === "ended" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-card/90 px-10 py-6">
            <Trophy className="size-10 text-primary" />
            <p className="font-mono text-xl font-bold text-foreground tracking-wider">GAME OVER</p>
            <Badge className="bg-primary/20 text-primary font-mono">
              Final leaderboard is locked in
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
