"use client"

import { useSyncExternalStore } from "react"
import type {
  GameState,
  GameEvent,
  FeedItem,
  PredictionMarket,
  Agent,
  TokenState,
  PricePoint,
} from "@/lib/game-types"

// Agent colors
const AGENT_COLORS = [
  "#3dd8e0",
  "#e04040",
  "#40e070",
  "#e0c040",
  "#e07040",
  "#a060e0",
  "#e06090",
  "#60a0e0",
  "#80e0a0",
  "#e0e060",
]

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function createMarket(question: string, relatedAgent?: string): PredictionMarket {
  const yesOdds = Math.round(30 + Math.random() * 40)
  return {
    id: createId(),
    question,
    yesOdds,
    noOdds: 100 - yesOdds,
    status: "OPEN",
    createdAt: Date.now(),
    relatedAgent,
  }
}

// --- Token economics ---

const BASE_PRICE = 0.001
const STARTING_CREDITS = 1000

const HYPE_MAP: Record<string, number> = {
  GAME_START: 20,
  KILL: 15,
  MEETING_START: 10,
  VOTE: 2,
  EJECTION: 8,
  GAME_END: 0,
}

function calcPrice(hypeScore: number): number {
  const multiplier = 1 + hypeScore / 50
  const noise = 0.97 + Math.random() * 0.06
  return parseFloat((BASE_PRICE * multiplier * noise).toFixed(6))
}

const initialToken: TokenState = {
  name: "SusProtocol",
  ticker: "$SUS",
  price: BASE_PRICE,
  priceHistory: [{ time: Date.now(), price: BASE_PRICE }],
  hypeScore: 0,
  userCredits: STARTING_CREDITS,
  userTokens: 0,
  gameActive: false,
  cashedOut: false,
}

const initialState: GameState = {
  phase: "waiting",
  agents: [],
  feed: [],
  markets: [],
  imposter: null,
  winner: null,
  connectionStatus: "disconnected",
  token: { ...initialToken },
}

// --- Lightweight external store ---

type Listener = () => void

let state: GameState = { ...initialState }
let listeners = new Set<Listener>()

function getSnapshot(): GameState {
  return state
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setState(updater: (prev: GameState) => GameState) {
  state = updater(state)
  listeners.forEach((l) => l())
}

// --- Feed helper ---

function addFeedItem(type: GameEvent["type"], message: string, details?: string) {
  const item: FeedItem = {
    id: createId(),
    timestamp: Date.now(),
    type,
    message,
    details,
  }
  setState((prev) => ({
    ...prev,
    feed: [item, ...prev.feed].slice(0, 200),
  }))
}

// --- Update token on hype event ---

function updateTokenHype(eventType: string, label?: string) {
  const hypeIncrease = HYPE_MAP[eventType] ?? 0
  if (hypeIncrease === 0 && eventType !== "GAME_END") return

  setState((prev) => {
    const newHype = prev.token.hypeScore + hypeIncrease
    const newPrice = eventType === "GAME_END" ? prev.token.price : calcPrice(newHype)
    const point: PricePoint = {
      time: Date.now(),
      price: newPrice,
      label,
    }
    return {
      ...prev,
      token: {
        ...prev.token,
        hypeScore: newHype,
        price: newPrice,
        priceHistory: [...prev.token.priceHistory, point],
        gameActive: eventType !== "GAME_END",
      },
    }
  })
}

// --- Process game events ---

function processEvent(event: GameEvent) {
  switch (event.type) {
    case "GAME_START": {
      const agents: Agent[] = event.agents.map((name, i) => ({
        name,
        alive: true,
        color: AGENT_COLORS[i % AGENT_COLORS.length],
      }))
      setState((prev) => ({
        ...prev,
        phase: "running",
        agents,
        feed: [],
        markets: [createMarket("Will the Crew win?")],
        imposter: event.imposter ?? null,
        winner: null,
        token: {
          ...initialToken,
          gameActive: true,
          priceHistory: [{ time: Date.now(), price: BASE_PRICE }],
        },
      }))
      addFeedItem("GAME_START", "Game Started", `${event.agents.length} agents entered`)
      updateTokenHype("GAME_START", "Launch")
      break
    }

    case "KILL": {
      setState((prev) => {
        const agents = prev.agents.map((a) =>
          a.name === event.victim ? { ...a, alive: false, killedAt: Date.now() } : a
        )
        const isFirstKill = prev.agents.filter((a) => !a.alive).length === 0
        const newMarkets = isFirstKill
          ? [
            createMarket(`Is ${event.killer} the Imposter?`, event.killer),
            createMarket(
              `Will ${agents.find((a) => a.alive && a.name !== event.killer)?.name ?? "someone"} survive?`
            ),
          ]
          : [createMarket(`Will ${event.killer} kill again?`, event.killer)]

        return { ...prev, agents, markets: [...prev.markets, ...newMarkets] }
      })
      addFeedItem("KILL", `${event.victim} was eliminated`, `Killed by ${event.killer}`)
      updateTokenHype("KILL", "Kill")
      break
    }

    case "MEETING_START": {
      setState((prev) => ({
        ...prev,
        phase: "meeting",
        markets: prev.markets.map((m) =>
          m.status === "OPEN" ? { ...m, status: "FROZEN" as const } : m
        ),
      }))
      addFeedItem("MEETING_START", "Emergency Meeting Called", "All agents assemble")
      updateTokenHype("MEETING_START", "Meeting")
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          markets: prev.markets.map((m) =>
            m.status === "FROZEN" ? { ...m, status: "OPEN" as const } : m
          ),
        }))
      }, 2000)
      break
    }

    case "VOTE": {
      addFeedItem("VOTE", `${event.agent} voted`, `Voted to eject ${event.target}`)
      updateTokenHype("VOTE")
      break
    }

    case "EJECTION": {
      setState((prev) => ({
        ...prev,
        phase: "running",
        agents: prev.agents.map((a) =>
          a.name === event.ejected
            ? { ...a, alive: false, ejected: true, ejectedAt: Date.now() }
            : a
        ),
      }))
      addFeedItem("EJECTION", `${event.ejected} was ejected`, "The crew has spoken")
      updateTokenHype("EJECTION", "Eject")
      break
    }

    case "GAME_END": {
      setState((prev) => ({
        ...prev,
        phase: "ended",
        winner: event.winner,
        imposter: event.imposter,
        markets: prev.markets.map((m) => {
          if (m.question.includes("Crew win")) {
            return {
              ...m,
              status: "RESOLVED" as const,
              resolved: event.winner === "crew" ? ("YES" as const) : ("NO" as const),
            }
          }
          if (m.question.includes("Imposter") && m.relatedAgent) {
            return {
              ...m,
              status: "RESOLVED" as const,
              resolved: m.relatedAgent === event.imposter ? ("YES" as const) : ("NO" as const),
            }
          }
          return { ...m, status: "RESOLVED" as const }
        }),
      }))
      addFeedItem(
        "GAME_END",
        event.winner === "crew" ? "Crew Wins!" : "Imposter Wins!",
        `The imposter was ${event.imposter}`
      )
      updateTokenHype("GAME_END", "End")
      break
    }
  }
}

// --- Token actions ---

function buyToken(amount: number) {
  setState((prev) => {
    if (!prev.token.gameActive || prev.token.cashedOut) return prev
    const cost = amount * prev.token.price
    if (cost > prev.token.userCredits) return prev
    return {
      ...prev,
      token: {
        ...prev.token,
        userCredits: parseFloat((prev.token.userCredits - cost).toFixed(2)),
        userTokens: prev.token.userTokens + amount,
      },
    }
  })
}

function sellToken(amount: number) {
  setState((prev) => {
    if (!prev.token.gameActive || prev.token.cashedOut) return prev
    if (amount > prev.token.userTokens) return prev
    const revenue = amount * prev.token.price
    return {
      ...prev,
      token: {
        ...prev.token,
        userCredits: parseFloat((prev.token.userCredits + revenue).toFixed(2)),
        userTokens: prev.token.userTokens - amount,
      },
    }
  })
}

function cashOut() {
  setState((prev) => {
    if (prev.token.cashedOut || prev.token.gameActive) return prev
    const revenue = prev.token.userTokens * prev.token.price
    return {
      ...prev,
      token: {
        ...prev.token,
        userCredits: parseFloat((prev.token.userCredits + revenue).toFixed(2)),
        userTokens: 0,
        cashedOut: true,
      },
    }
  })
}

// --- Exported hook ---

export function useGameStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// Stable module-level actions object
export const gameActions = {
  processEvent,
  setConnectionStatus: (status: GameState["connectionStatus"]) =>
    setState((prev) => ({ ...prev, connectionStatus: status })),
  resetGame: () =>
    setState(() => ({ ...initialState, token: { ...initialToken, priceHistory: [{ time: Date.now(), price: BASE_PRICE }] } })),
  buyToken,
  sellToken,
  cashOut,
  setGameMeta: ({ ticker, title }: { ticker: string; title: string }) =>
    setState((prev) => ({
      ...prev,
      token: { ...prev.token, ticker, name: title },
    })),
}

export function useGameActions() {
  return gameActions
}
