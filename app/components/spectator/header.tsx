"use client"

import { useGameStore } from "@/hooks/use-game-store"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { useRef } from "react"
import type { GameListing } from "@/lib/games-data"

const phaseLabels: Record<string, string> = {
  waiting: "STANDBY",
  running: "LIVE",
  meeting: "MEETING",
  ended: "GAME OVER",
}

const phaseColors: Record<string, string> = {
  waiting: "bg-muted text-muted-foreground",
  running: "bg-primary/20 text-primary",
  meeting: "bg-accent/20 text-accent",
  ended: "bg-destructive/20 text-destructive",
}

interface SpectatorHeaderProps {
  gameMeta?: GameListing
}

export function SpectatorHeader({ gameMeta }: SpectatorHeaderProps) {
  const { phase, connectionStatus, token } = useGameStore()
  const prevPriceRef = useRef(token.price)
  const priceUp = token.price >= prevPriceRef.current

  // Update ref on each render so we track direction
  if (token.price !== prevPriceRef.current) {
    prevPriceRef.current = token.price
  }

  // Use live store ticker if game is active, otherwise fall back to gameMeta ticker
  const displayTicker = token.gameActive ? token.ticker : (gameMeta?.tokenTicker ?? token.ticker)

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-wider text-foreground font-mono">
          SUS<span className="text-primary">PROTOCOL</span>
        </h1>
        {gameMeta && (
          <span className="font-mono text-xs text-muted-foreground hidden sm:block">
            {gameMeta.title}
          </span>
        )}
        <Badge className={`${phaseColors[phase]} text-[10px] font-mono`}>
          {phase === "running" && (
            <span className="mr-1 size-1.5 rounded-full bg-primary animate-pulse inline-block" />
          )}
          {phaseLabels[phase]}
        </Badge>
      </div>

      <div className="flex items-center gap-5">
        {/* Token ticker */}
        {token.gameActive || phase === "ended" ? (
          <div className="flex items-center gap-2 rounded-md bg-secondary/80 border border-border/50 px-3 py-1">
            <span className="font-mono text-xs text-muted-foreground">{displayTicker}</span>
            <span className={`font-mono text-sm font-bold tabular-nums ${priceUp ? "text-success" : "text-danger"}`}>
              ${token.price.toFixed(4)}
            </span>
            {priceUp ? (
              <TrendingUp className="size-3.5 text-success" />
            ) : (
              <TrendingDown className="size-3.5 text-danger" />
            )}
            <span className="font-mono text-[10px] text-muted-foreground">
              HYPE:{token.hypeScore}
            </span>
          </div>
        ) : null}

        {/* Connection */}
        <div className="flex items-center gap-1.5">
          {connectionStatus === "connected" ? (
            <Wifi className="size-3.5 text-primary" />
          ) : connectionStatus === "connecting" ? (
            <Loader2 className="size-3.5 text-accent animate-spin" />
          ) : (
            <WifiOff className="size-3.5 text-destructive" />
          )}
          <span className="text-[10px] text-muted-foreground font-mono uppercase">
            {connectionStatus}
          </span>
        </div>
      </div>
    </header>
  )
}
