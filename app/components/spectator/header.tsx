"use client"

import { useGameStore } from "@/hooks/use-game-store"
import { useWallet } from "@/hooks/wallet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2, Wallet } from "lucide-react"
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
  const { phase, connectionStatus, leaderboard, markets, currentUserId } = useGameStore()
  const { accountData, connectWallet } = useWallet()
  const leader = leaderboard[0]
  const you = leaderboard.find((entry) => entry.userId === currentUserId)
  const resolvedCount = markets.filter((market) => market.status === "RESOLVED").length

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-wider text-foreground font-mono">
          EVEN<span className="text-primary">TRIX</span>
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
        {/* Leaderboard snapshot */}
        {phase !== "waiting" ? (
          <div className="flex items-center gap-2 rounded-md bg-secondary/80 border border-border/50 px-3 py-1">
            <span className="font-mono text-xs text-muted-foreground">Leader</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {leader?.username ?? "—"}
            </span>
            <span className="font-mono text-[10px] text-primary">
              {leader ? `${leader.points} pts` : ""}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              You: #{you?.rank ?? "-"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Resolved: {resolvedCount}
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
          <span className="text-[10px] text-muted-foreground font-mono uppercase mr-2">
            {connectionStatus}
          </span>
        </div>

        {/* Wallet */}
        <Button
          size="sm"
          variant={accountData?.address ? "outline" : "default"}
          onClick={connectWallet}
          className="h-8 font-mono text-xs border-primary/30"
        >
          <Wallet className="size-3.5 mr-2" />
          {accountData?.address
            ? `${accountData.address.slice(0, 6)}...${accountData.address.slice(-4)}`
            : "Connect Wallet"}
        </Button>
      </div>
    </header>
  )
}
