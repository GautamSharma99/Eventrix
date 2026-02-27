"use client"

import { useGameStore } from "@/hooks/use-game-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Lock, CheckCircle2, XCircle, BarChart3 } from "lucide-react"
import type { MarketStatus } from "@/lib/game-types"

const statusConfig: Record<
  MarketStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  OPEN: {
    label: "OPEN",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    icon: TrendingUp,
  },
  FROZEN: {
    label: "FROZEN",
    color: "text-accent",
    bg: "bg-accent/10 border-accent/30",
    icon: Lock,
  },
  RESOLVED: {
    label: "RESOLVED",
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
    icon: CheckCircle2,
  },
}

export function PredictionMarkets() {
  const { markets } = useGameStore()

  const openMarkets = markets.filter((m) => m.status === "OPEN")
  const frozenMarkets = markets.filter((m) => m.status === "FROZEN")
  const resolvedMarkets = markets.filter((m) => m.status === "RESOLVED")

  const sortedMarkets = [...openMarkets, ...frozenMarkets, ...resolvedMarkets]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
        <BarChart3 className="size-3.5 text-primary" />
        <span className="font-mono text-xs font-bold text-foreground tracking-wider uppercase">
          Prediction Markets
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {openMarkets.length} open
        </span>
      </div>

      {sortedMarkets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-8 opacity-30" />
            <p className="font-mono text-xs">Markets appear as the game unfolds</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedMarkets.map((market, i) => {
              const config = statusConfig[market.status]
              const StatusIcon = config.icon

              return (
                <div
                  key={market.id}
                  className={`rounded-lg border p-3.5 transition-all ${config.bg} ${
                    i < 3 && market.status === "OPEN"
                      ? "animate-in slide-in-from-bottom-2 fade-in duration-500"
                      : ""
                  } ${market.status === "FROZEN" ? "opacity-75" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <p className="text-xs font-semibold text-foreground leading-snug flex-1">
                      {market.question}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono shrink-0 ${config.color} ${config.bg}`}
                    >
                      <StatusIcon className="size-2.5 mr-0.5" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Odds bar */}
                  <div className="mb-2.5">
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                      <span>YES {market.yesOdds}%</span>
                      <span>NO {market.noOdds}%</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-primary transition-all duration-500 rounded-l-full"
                        style={{ width: `${market.yesOdds}%` }}
                      />
                      <div
                        className="bg-destructive transition-all duration-500 rounded-r-full"
                        style={{ width: `${market.noOdds}%` }}
                      />
                    </div>
                  </div>

                  {/* Resolved */}
                  {market.status === "RESOLVED" && market.resolved && (
                    <div
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-bold font-mono ${
                        market.resolved === "YES"
                          ? "bg-primary/20 text-primary"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {market.resolved === "YES" ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <XCircle className="size-3" />
                      )}
                      {market.resolved}
                    </div>
                  )}

                  {/* Action buttons */}
                  {market.status === "OPEN" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-mono text-[10px] h-7"
                        variant="outline"
                      >
                        YES
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 font-mono text-[10px] h-7"
                        variant="outline"
                      >
                        NO
                      </Button>
                    </div>
                  )}

                  {/* Frozen */}
                  {market.status === "FROZEN" && (
                    <div className="flex items-center justify-center gap-1.5 rounded-md border border-accent/20 bg-accent/5 px-2 py-1.5 text-[10px] text-accent font-mono">
                      <Lock className="size-2.5" />
                      Paused during meeting
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
