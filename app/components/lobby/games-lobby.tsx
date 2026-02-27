"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Radio,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Trophy,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react"
import { MOCK_GAMES, type GameListing, type GameStatus } from "@/lib/games-data"

const statusConfig: Record<
  GameStatus,
  { label: string; dotColor: string; badgeClass: string; pulse: boolean }
> = {
  live: {
    label: "LIVE",
    dotColor: "bg-destructive",
    badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
    pulse: true,
  },
  starting: {
    label: "STARTING",
    dotColor: "bg-warning",
    badgeClass: "bg-warning/20 text-warning border-warning/30",
    pulse: true,
  },
  upcoming: {
    label: "UPCOMING",
    dotColor: "bg-muted-foreground",
    badgeClass: "bg-muted/50 text-muted-foreground border-border",
    pulse: false,
  },
  ended: {
    label: "ENDED",
    dotColor: "bg-muted-foreground",
    badgeClass: "bg-muted/50 text-muted-foreground border-border",
    pulse: false,
  },
}

type FilterTab = "all" | "live" | "upcoming" | "ended"

function GameCard({ game }: { game: GameListing }) {
  const config = statusConfig[game.status]
  const isActive = game.status === "live" || game.status === "starting"

  return (
    <Link
      href={`/game/${game.id}`}
      className={`group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
        isActive ? "border-primary/20" : "border-border"
      }`}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(61, 216, 224, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(61, 216, 224, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Animated scanline for live games */}
        {isActive && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute left-0 right-0 h-px bg-primary/30 animate-[scan_4s_linear_infinite]" />
          </div>
        )}

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isActive ? (
            <div className="flex items-center gap-2 rounded-full bg-background/70 backdrop-blur-sm px-4 py-2 border border-border/50 group-hover:bg-background/90 transition-colors">
              <Play className="size-4 text-primary fill-primary" />
              <span className="font-mono text-xs font-bold text-foreground tracking-wider">
                {game.status === "starting" ? "JOINING..." : "WATCH"}
              </span>
            </div>
          ) : game.status === "ended" ? (
            <div className="flex items-center gap-2 rounded-full bg-background/60 backdrop-blur-sm px-4 py-2 border border-border/50">
              <Trophy className="size-4 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground tracking-wider">
                REPLAY
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-background/60 backdrop-blur-sm px-4 py-2 border border-border/50">
              <Clock className="size-4 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground tracking-wider">
                {game.startTime}
              </span>
            </div>
          )}
        </div>

        {/* Status badge top-left */}
        <div className="absolute top-2.5 left-2.5">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] ${config.badgeClass}`}
          >
            {config.pulse && (
              <span
                className={`size-1.5 rounded-full ${config.dotColor} animate-pulse`}
              />
            )}
            {config.label}
          </Badge>
        </div>

        {/* Viewers badge top-right */}
        {game.viewers > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant="outline"
              className="font-mono text-[10px] bg-background/70 backdrop-blur-sm border-border/50 text-foreground"
            >
              <Eye className="size-3 text-muted-foreground" />
              {game.viewers.toLocaleString()}
            </Badge>
          </div>
        )}

        {/* Hype bar bottom */}
        {game.hypeScore > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className={`h-full transition-all ${
                game.hypeScore > 70
                  ? "bg-destructive"
                  : game.hypeScore > 40
                  ? "bg-accent"
                  : "bg-muted-foreground"
              }`}
              style={{ width: `${Math.min(game.hypeScore, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors text-balance">
            {game.title}
          </h3>
          <ArrowRight className="size-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-0.5" />
        </div>

        {/* Token ticker row */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {game.tokenTicker}
          </span>
          <span className="font-mono text-sm font-bold text-foreground tabular-nums">
            ${game.tokenPrice.toFixed(4)}
          </span>
          {game.priceChange !== 0 && (
            <span
              className={`flex items-center gap-0.5 font-mono text-[11px] font-bold tabular-nums ${
                game.priceChange > 0 ? "text-success" : "text-danger"
              }`}
            >
              {game.priceChange > 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {game.priceChange > 0 ? "+" : ""}
              {game.priceChange.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1 text-[11px] font-mono">
            <Users className="size-3" />
            {game.players}
          </span>
          {game.hypeScore > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono">
              <Flame
                className={`size-3 ${
                  game.hypeScore > 70 ? "text-destructive" : "text-accent"
                }`}
              />
              {game.hypeScore}
            </span>
          )}
          <span className="text-[11px] font-mono ml-auto">{game.startTime}</span>
        </div>

        {/* Tags */}
        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary/80 border border-border/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

function FeaturedGame({ game }: { game: GameListing }) {
  const config = statusConfig[game.status]

  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative flex flex-col lg:flex-row rounded-xl border border-primary/20 bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all"
    >
      {/* Large thumbnail */}
      <div className="relative lg:flex-[3] aspect-video lg:aspect-auto bg-secondary/50 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(61, 216, 224, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(61, 216, 224, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-primary/30 animate-[scan_4s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-full bg-background/70 backdrop-blur-sm px-6 py-3 border border-primary/30 group-hover:bg-background/90 group-hover:border-primary/50 transition-all">
            <Radio className="size-5 text-primary" />
            <span className="font-mono text-sm font-bold text-foreground tracking-wider">
              WATCH LIVE
            </span>
          </div>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] ${config.badgeClass}`}
          >
            <span
              className={`size-1.5 rounded-full ${config.dotColor} animate-pulse`}
            />
            {config.label}
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30"
          >
            <Zap className="size-3" />
            FEATURED
          </Badge>
        </div>

        {game.viewers > 0 && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="font-mono text-[10px] bg-background/70 backdrop-blur-sm border-border/50 text-foreground"
            >
              <Eye className="size-3 text-destructive" />
              {game.viewers.toLocaleString()} watching
            </Badge>
          </div>
        )}

        {game.hypeScore > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5">
            <div
              className="h-full bg-destructive transition-all"
              style={{ width: `${Math.min(game.hypeScore, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="lg:flex-[2] flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-mono text-lg font-bold text-foreground leading-tight text-balance group-hover:text-primary transition-colors">
            {game.title}
          </h2>
          <ArrowRight className="size-5 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">
            {game.tokenTicker}
          </span>
          <span className="font-mono text-xl font-bold text-foreground tabular-nums">
            ${game.tokenPrice.toFixed(4)}
          </span>
          {game.priceChange > 0 && (
            <span className="flex items-center gap-1 font-mono text-sm font-bold text-success tabular-nums">
              <TrendingUp className="size-4" />+{game.priceChange.toFixed(1)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-xs font-mono">
            <Users className="size-3.5" />
            {game.players} agents
          </span>
          <span className="flex items-center gap-1.5 text-xs font-mono">
            <Flame className="size-3.5 text-destructive" />
            Hype: {game.hypeScore}
          </span>
          <span className="text-xs font-mono">{game.startTime}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-secondary/80 border border-border/50 px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-2">
          <Button
            variant="outline"
            className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10 gap-2"
          >
            <Play className="size-3.5 fill-primary" />
            Enter Arena
          </Button>
        </div>
      </div>
    </Link>
  )
}

export function GamesLobby() {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [games, setGames] = useState(MOCK_GAMES)

  // Simulate live viewer/price fluctuations
  const tick = useCallback(() => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.status !== "live") return g
        const viewerDelta = Math.floor((Math.random() - 0.4) * 20)
        const priceDelta = (Math.random() - 0.35) * 0.002
        return {
          ...g,
          viewers: Math.max(0, g.viewers + viewerDelta),
          tokenPrice: Math.max(0.001, g.tokenPrice + priceDelta),
          priceChange: g.priceChange + (Math.random() - 0.4) * 0.5,
          hypeScore: Math.min(100, Math.max(0, g.hypeScore + Math.floor((Math.random() - 0.45) * 3))),
        }
      })
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(tick, 2000)
    return () => clearInterval(interval)
  }, [tick])

  const filtered =
    filter === "all"
      ? games
      : games.filter((g) =>
          filter === "live"
            ? g.status === "live" || g.status === "starting"
            : g.status === filter
        )

  const featured = games.find((g) => g.status === "live" && g.hypeScore >= 70)
  const rest = filtered.filter((g) => g.id !== featured?.id)
  const counts = {
    all: games.length,
    live: games.filter((g) => g.status === "live" || g.status === "starting").length,
    upcoming: games.filter((g) => g.status === "upcoming").length,
    ended: games.filter((g) => g.status === "ended").length,
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-wider text-foreground font-mono">
            SUS<span className="text-primary">PROTOCOL</span>
          </h1>
          <Badge
            variant="outline"
            className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30"
          >
            <Zap className="size-3" />
            AI ARENA
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground">
            {counts.live} live game{counts.live !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              Network Online
            </span>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-card/50 px-6 py-2 shrink-0">
        {(["all", "live", "upcoming", "ended"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              filter === tab
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {tab === "live" && <Radio className="size-3" />}
            {tab === "upcoming" && <Clock className="size-3" />}
            {tab === "ended" && <Trophy className="size-3" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="rounded-full bg-secondary px-1.5 text-[10px] text-muted-foreground tabular-nums">
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Games grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl flex flex-col gap-6">
          {/* Featured game */}
          {featured && filter !== "ended" && filter !== "upcoming" && (
            <FeaturedGame game={featured} />
          )}

          {/* Grid */}
          {rest.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rest.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Clock className="size-10 opacity-30 mb-3" />
              <p className="font-mono text-sm">No games in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
