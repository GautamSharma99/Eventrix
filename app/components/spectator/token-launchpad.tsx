"use client"

import { useState } from "react"
import { useGameStore } from "@/hooks/use-game-store"
import { gameActions } from "@/hooks/use-game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Coins,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  Flame,
  Lock,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts"

function HypeMeter({ score }: { score: number }) {
  const capped = Math.min(score, 100)
  const color =
    capped < 30
      ? "bg-muted-foreground"
      : capped < 60
      ? "bg-warning"
      : capped < 80
      ? "bg-accent"
      : "bg-destructive"

  return (
    <div className="flex items-center gap-2">
      <Flame className="size-4 text-accent shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${capped}%` }}
        />
      </div>
      <span className="font-mono text-xs text-muted-foreground tabular-nums w-8 text-right">
        {score}
      </span>
    </div>
  )
}

function PriceChart() {
  const { token } = useGameStore()
  const data = token.priceHistory.map((p, i) => ({
    idx: i,
    price: p.price,
    label: p.label,
  }))

  const labeledPoints = data.filter((d) => d.label)

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis dataKey="idx" hide />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            width={60}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
            formatter={(value: number) => [`$${value.toFixed(6)}`, "Price"]}
            labelFormatter={() => ""}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            animationDuration={300}
          />
          {labeledPoints.map((p) => (
            <ReferenceLine
              key={`${p.idx}-${p.label}`}
              x={p.idx}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: p.label,
                position: "top",
                fill: "var(--muted-foreground)",
                fontSize: 9,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TokenLaunchpad() {
  const { token, phase } = useGameStore()
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")

  const canTrade = token.gameActive && !token.cashedOut
  const canCashOut = phase === "ended" && !token.cashedOut && token.userTokens > 0
  const portfolioValue = token.userTokens * token.price

  function handleBuy() {
    const amt = parseInt(buyAmount)
    if (amt > 0) {
      gameActions.buyToken(amt)
      setBuyAmount("")
    }
  }

  function handleSell() {
    const amt = parseInt(sellAmount)
    if (amt > 0) {
      gameActions.sellToken(amt)
      setSellAmount("")
    }
  }

  return (
    <div className="flex gap-4 p-4 h-full overflow-auto">
      {/* Left: Chart + hype */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            <span className="font-mono text-sm font-bold text-foreground">{token.ticker}</span>
          </div>
          <span className="font-mono text-lg font-bold text-foreground tabular-nums">
            ${token.price.toFixed(4)}
          </span>
          {token.priceHistory.length > 1 && (
            <span className={`font-mono text-xs tabular-nums ${
              token.price > token.priceHistory[0].price ? "text-success" : "text-danger"
            }`}>
              {token.price > token.priceHistory[0].price ? "+" : ""}
              {(((token.price - token.priceHistory[0].price) / token.priceHistory[0].price) * 100).toFixed(1)}%
            </span>
          )}
          {!canTrade && phase !== "waiting" && (
            <div className="flex items-center gap-1 ml-auto">
              <Lock className="size-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {token.cashedOut ? "CASHED OUT" : "TRADING CLOSED"}
              </span>
            </div>
          )}
        </div>

        <HypeMeter score={token.hypeScore} />
        <PriceChart />

        {phase === "waiting" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-xs text-muted-foreground">
              Token launches when the game starts
            </p>
          </div>
        )}
      </div>

      {/* Right: Trading panel */}
      <div className="w-[280px] shrink-0 flex flex-col gap-3">
        {/* Balance card */}
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold text-foreground tracking-wider uppercase">
              Your Wallet
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">Credits</span>
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                ${token.userCredits.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{token.ticker} Held</span>
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                {token.userTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
              <span className="text-xs text-muted-foreground font-mono">Portfolio</span>
              <span className="font-mono text-sm font-bold text-primary tabular-nums">
                ${portfolioValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Buy / Sell */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              disabled={!canTrade}
              className="flex-1 font-mono text-xs h-8 bg-secondary/50"
            />
            <Button
              size="sm"
              disabled={!canTrade || !buyAmount}
              onClick={handleBuy}
              className="font-mono text-xs h-8 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              variant="outline"
            >
              <ArrowDownToLine className="size-3 mr-1" />
              BUY
            </Button>
          </div>
          {buyAmount && canTrade && (
            <p className="text-[10px] text-muted-foreground font-mono pl-1">
              Cost: ${(parseInt(buyAmount || "0") * token.price).toFixed(4)}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              disabled={!canTrade}
              className="flex-1 font-mono text-xs h-8 bg-secondary/50"
            />
            <Button
              size="sm"
              disabled={!canTrade || !sellAmount}
              onClick={handleSell}
              className="font-mono text-xs h-8 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
              variant="outline"
            >
              <ArrowUpFromLine className="size-3 mr-1" />
              SELL
            </Button>
          </div>
          {sellAmount && canTrade && (
            <p className="text-[10px] text-muted-foreground font-mono pl-1">
              Revenue: ${(parseInt(sellAmount || "0") * token.price).toFixed(4)}
            </p>
          )}
        </div>

        {/* Quick buy buttons */}
        {canTrade && (
          <div className="flex gap-1.5">
            {[100, 500, 1000, 5000].map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant="outline"
                className="flex-1 font-mono text-[10px] h-6 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => {
                  gameActions.buyToken(amt)
                }}
              >
                {amt >= 1000 ? `${amt / 1000}K` : amt}
              </Button>
            ))}
          </div>
        )}

        {/* Cash out button */}
        {canCashOut && (
          <Button
            onClick={() => gameActions.cashOut()}
            className="w-full font-mono text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-10"
          >
            <DollarSign className="size-4 mr-1" />
            CASH OUT ${(token.userTokens * token.price).toFixed(2)}
          </Button>
        )}

        {token.cashedOut && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-center">
            <p className="font-mono text-xs text-success font-bold">TOKENS CASHED OUT</p>
            <p className="font-mono text-lg text-success font-bold tabular-nums">
              ${token.userCredits.toFixed(2)}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">Final balance</p>
          </div>
        )}
      </div>
    </div>
  )
}
