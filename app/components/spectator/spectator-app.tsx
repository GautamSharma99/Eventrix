"use client"

import { useEffect } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { useDemoSimulation } from "@/hooks/use-demo-simulation"
import { useGameStore, gameActions } from "@/hooks/use-game-store"
import { SpectatorHeader } from "./header"
import { StreamPlayer } from "./stream-player"
import { PredictionMarkets } from "./prediction-markets"
import { TokenLaunchpad } from "./token-launchpad"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Play, RotateCcw, BarChart3, Trophy, ArrowLeft } from "lucide-react"
import { MOCK_GAMES } from "@/lib/games-data"
import Link from "next/link"

const BRIDGE_URL = process.env.NEXT_PUBLIC_BRIDGE_URL ?? "http://localhost:8000"

interface SpectatorAppProps {
  gameId?: string
}

export function SpectatorApp({ gameId }: SpectatorAppProps) {
  // Connect to per-game WS channel when gameId is known
  useWebSocket(gameId)

  const { phase } = useGameStore()
  const { start, stop } = useDemoSimulation()

  // Look up this game's metadata so the header can show the right ticker/title
  const gameMeta = gameId ? MOCK_GAMES.find((g) => g.id === gameId) : null

  // Reset on unmount so next page starts clean
  useEffect(() => {
    return () => {
      gameActions.resetGame()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <SpectatorHeader gameMeta={gameMeta ?? undefined} />

      {/* Demo controls bar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-1.5 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" />
            All Games
          </Link>
          {gameMeta && (
            <p className="text-[10px] text-muted-foreground font-mono">
              {gameMeta.id.toUpperCase()} — {gameMeta.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="font-mono text-[10px] h-6 border-primary/30 text-primary hover:bg-primary/10"
            onClick={async () => {
              // Try real bridge first; fall back to local demo simulation
              try {
                const res = await fetch(`${BRIDGE_URL}/game/start`, { method: "POST" })
                if (!res.ok) throw new Error()
              } catch {
                start()
              }
            }}
            disabled={phase === "running" || phase === "meeting"}
          >
            <Play className="size-3 mr-1" />
            {phase === "ended" ? "Replay" : "Start Game"}
          </Button>
          {(phase === "running" || phase === "meeting") && (
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-[10px] h-6 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={stop}
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main content: Stream + Tabs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Stream area -- takes ~55% */}
        <div className="flex-[55] min-h-0 border-b border-border">
          <StreamPlayer gameId={gameId} />
        </div>

        {/* Bottom tabs -- takes ~45% */}
        <Tabs defaultValue="betting" className="flex-[45] min-h-0 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-card h-10 px-4 gap-1 shrink-0">
            <TabsTrigger
              value="betting"
              className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 gap-1.5"
            >
              <BarChart3 className="size-3.5" />
              Predictions
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 gap-1.5"
            >
              <Trophy className="size-3.5" />
              Agent Tokens
            </TabsTrigger>
          </TabsList>
          <TabsContent value="betting" className="flex-1 overflow-auto m-0">
            <PredictionMarkets />
          </TabsContent>
          <TabsContent value="leaderboard" className="flex-1 overflow-hidden m-0">
            <TokenLaunchpad />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
