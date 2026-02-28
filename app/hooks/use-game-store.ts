"use client"

import { useSyncExternalStore } from "react"
import type {
  Agent,
  FeedItem,
  GameEvent,
  GameState,
  LeaderboardEntry,
  MarketKind,
  PredictionChoice,
  PredictionMarket,
} from "@/lib/game-types"

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

const CURRENT_USER_ID = "you"
const SCORE_CORRECT = 10
const SCORE_EARLY = 2
const EARLY_WINDOW_MS = 6000

const LEADERBOARD_USERS = [
  { userId: CURRENT_USER_ID, username: "You" },
  { userId: "nova_fan", username: "NovaFan" },
  { userId: "taskmaster", username: "TaskMaster" },
  { userId: "ghostcam", username: "GhostCam" },
  { userId: "crewlogic", username: "CrewLogic" },
  { userId: "ventwatch", username: "VentWatch" },
]

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function createMarket(kind: MarketKind, question: string, relatedAgent?: string): PredictionMarket {
  const yesOdds = Math.round(40 + Math.random() * 20)
  return {
    id: createId(),
    kind,
    question,
    yesOdds,
    noOdds: 100 - yesOdds,
    status: "OPEN",
    createdAt: Date.now(),
    relatedAgent,
    predictions: {},
  }
}

function accuracy(entry: LeaderboardEntry): number {
  if (entry.total === 0) return 0
  return (entry.correct / entry.total) * 100
}

function rankLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const accDiff = accuracy(b) - accuracy(a)
    if (accDiff !== 0) return accDiff
    return a.username.localeCompare(b.username)
  })
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function initialLeaderboard(): LeaderboardEntry[] {
  return rankLeaderboard(
    LEADERBOARD_USERS.map((u) => ({
      userId: u.userId,
      username: u.username,
      points: 0,
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      rank: 0,
      lastDelta: 0,
    }))
  )
}

function createInitialState(): GameState {
  return {
    phase: "waiting",
    agents: [],
    feed: [],
    markets: [],
    leaderboard: initialLeaderboard(),
    currentUserId: CURRENT_USER_ID,
    imposter: null,
    winner: null,
    connectionStatus: "disconnected",
  }
}

function applyCrowdOdds(market: PredictionMarket): PredictionMarket {
  const predictions = Object.values(market.predictions)
  if (predictions.length === 0) return market
  const yesCount = predictions.filter((p) => p.choice === "YES").length
  const yesOdds = Math.round((yesCount / predictions.length) * 100)
  return {
    ...market,
    yesOdds,
    noOdds: 100 - yesOdds,
  }
}

function withBotPredictions(
  market: PredictionMarket,
  leaderboard: LeaderboardEntry[],
  currentUserId: string
): PredictionMarket {
  let seeded = { ...market, predictions: { ...market.predictions } }
  for (const entry of leaderboard) {
    if (entry.userId === currentUserId) continue
    const choice: PredictionChoice = Math.random() * 100 < seeded.yesOdds ? "YES" : "NO"
    const predictedAt = seeded.createdAt + Math.floor(Math.random() * 9000)
    seeded.predictions[entry.userId] = {
      userId: entry.userId,
      choice,
      predictedAt,
    }
  }
  return applyCrowdOdds(seeded)
}

function appendMarkets(prev: GameState, freshMarkets: PredictionMarket[]): GameState {
  if (freshMarkets.length === 0) return prev
  const seeded = freshMarkets.map((m) =>
    withBotPredictions(m, prev.leaderboard, prev.currentUserId)
  )
  return {
    ...prev,
    markets: [...prev.markets, ...seeded],
  }
}

function resolveSingleMarket(state: GameState, marketId: string, outcome: PredictionChoice): GameState {
  const target = state.markets.find((m) => m.id === marketId)
  if (!target || target.status === "RESOLVED") return state

  const resolvedAt = Date.now()
  const markets = state.markets.map((m) =>
    m.id === marketId
      ? {
        ...m,
        status: "RESOLVED" as const,
        resolved: outcome,
        lockedAt: m.lockedAt ?? resolvedAt,
        resolvedAt,
      }
      : m
  )

  const leaderboard = rankLeaderboard(
    state.leaderboard.map((entry) => {
      const prediction = target.predictions[entry.userId]
      if (!prediction) return { ...entry, lastDelta: 0 }

      const isCorrect = prediction.choice === outcome
      const earlyBonus =
        isCorrect && prediction.predictedAt - target.createdAt <= EARLY_WINDOW_MS ? SCORE_EARLY : 0
      const delta = isCorrect ? SCORE_CORRECT + earlyBonus : 0
      const nextStreak = isCorrect ? entry.streak + 1 : 0

      return {
        ...entry,
        points: entry.points + delta,
        correct: entry.correct + (isCorrect ? 1 : 0),
        total: entry.total + 1,
        streak: nextStreak,
        bestStreak: Math.max(entry.bestStreak, nextStreak),
        lastDelta: delta,
      }
    })
  )

  return {
    ...state,
    markets,
    leaderboard,
  }
}

function resolveMarkets(
  state: GameState,
  shouldResolve: (market: PredictionMarket) => boolean,
  outcomeFor: (market: PredictionMarket, snapshot: GameState) => PredictionChoice
): GameState {
  let next = state
  for (const market of state.markets) {
    if (market.status === "RESOLVED") continue
    if (!shouldResolve(market)) continue
    next = resolveSingleMarket(next, market.id, outcomeFor(market, next))
  }
  return next
}

function submitPrediction(marketId: string, choice: PredictionChoice) {
  let accepted = false
  setState((prev) => {
    const market = prev.markets.find((m) => m.id === marketId)
    if (!market || market.status !== "OPEN") return prev
    if (market.predictions[prev.currentUserId]) return prev

    accepted = true
    const updated = applyCrowdOdds({
      ...market,
      predictions: {
        ...market.predictions,
        [prev.currentUserId]: {
          userId: prev.currentUserId,
          choice,
          predictedAt: Date.now(),
        },
      },
    })

    return {
      ...prev,
      markets: prev.markets.map((m) => (m.id === marketId ? updated : m)),
    }
  })

  if (accepted) {
    addFeedItem("VOTE", `You predicted ${choice}`, "Points update when this market resolves")
  }
}

let meetingUnlockTimer: ReturnType<typeof setTimeout> | null = null

const initialState = createInitialState()

type Listener = () => void

let state: GameState = initialState
const listeners = new Set<Listener>()

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

function processEvent(event: GameEvent) {
  switch (event.type) {
    case "GAME_START": {
      if (meetingUnlockTimer) clearTimeout(meetingUnlockTimer)
      const names = event.agents ?? event.players ?? []
      const isChess = event.game_type === "chess"
      const agents: Agent[] = names.map((name, i) => ({
        name,
        alive: true,
        color: AGENT_COLORS[i % AGENT_COLORS.length],
      }))
      const leaderboard = initialLeaderboard()

      if (isChess) {
        // Chess — no prediction markets at start, simpler state
        setState((prev) => ({
          ...createInitialState(),
          phase: "running",
          agents,
          leaderboard,
          markets: [],
          imposter: null,
          winner: null,
          connectionStatus: prev.connectionStatus,
        }))
        addFeedItem("GAME_START", "Chess Match Started", `${event.mode ?? "agent_vs_agent"} · White vs Black`)
      } else {
        // Among Us
        const openingMarket = withBotPredictions(
          createMarket("crew_win", "Will the Crew win?"),
          leaderboard,
          CURRENT_USER_ID
        )
        setState((prev) => ({
          ...createInitialState(),
          phase: "running",
          agents,
          leaderboard,
          markets: [openingMarket],
          imposter: event.imposter ?? null,
          winner: null,
          connectionStatus: prev.connectionStatus,
        }))
        addFeedItem("GAME_START", "Game Started", `${names.length} agents entered`)
      }
      break
    }

    case "KILL": {
      setState((prev) => {
        const agents = prev.agents.map((a) =>
          a.name === event.victim ? { ...a, alive: false, killedAt: Date.now() } : a
        )

        let next: GameState = { ...prev, phase: "running", agents }

        next = resolveMarkets(
          next,
          (market) => market.kind === "killer_kill_again" && market.relatedAgent === event.killer,
          () => "YES"
        )
        next = resolveMarkets(
          next,
          (market) => market.kind === "agent_survive_round" && market.relatedAgent === event.victim,
          () => "NO"
        )

        const wasFirstKill = prev.agents.every((a) => a.alive)
        if (wasFirstKill) {
          const survivorCandidate = agents.find((a) => a.alive && a.name !== event.killer)?.name
          const newMarkets = [
            createMarket("identify_impostor", `Is ${event.killer} the Impostor?`, event.killer),
          ]
          if (survivorCandidate) {
            newMarkets.push(
              createMarket(
                "agent_survive_round",
                `Will ${survivorCandidate} survive this round?`,
                survivorCandidate
              )
            )
          }
          return appendMarkets(next, newMarkets)
        }

        return appendMarkets(
          next,
          [createMarket("killer_kill_again", `Will ${event.killer} kill again?`, event.killer)]
        )
      })

      addFeedItem("KILL", `${event.victim} was eliminated`, `Killed by ${event.killer}`)
      break
    }

    case "MEETING_START": {
      setState((prev) => {
        let next: GameState = {
          ...prev,
          phase: "meeting",
          markets: prev.markets.map((m) =>
            m.status === "OPEN" ? { ...m, status: "FROZEN" as const, lockedAt: Date.now() } : m
          ),
        }
        next = appendMarkets(next, [createMarket("meeting_ejects", "Will this meeting eject an agent?")])
        return next
      })

      addFeedItem("MEETING_START", "Emergency Meeting Called", "All agents assemble")

      if (meetingUnlockTimer) clearTimeout(meetingUnlockTimer)
      meetingUnlockTimer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          markets: prev.markets.map((m) => (m.status === "FROZEN" ? { ...m, status: "OPEN" as const } : m)),
        }))
      }, 2000)
      break
    }

    case "VOTE": {
      addFeedItem("VOTE", `${event.agent} voted`, `Voted to eject ${event.target}`)
      break
    }

    case "EJECTION": {
      setState((prev) => {
        let next: GameState = {
          ...prev,
          phase: "running",
          agents: prev.agents.map((a) =>
            a.name === event.ejected
              ? { ...a, alive: false, ejected: true, ejectedAt: Date.now() }
              : a
          ),
        }

        next = resolveMarkets(
          next,
          (market) => market.kind === "meeting_ejects",
          () => "YES"
        )
        next = resolveMarkets(
          next,
          (market) => market.kind === "agent_survive_round" && !!market.relatedAgent,
          (market, snapshot) => {
            const agent = snapshot.agents.find((a) => a.name === market.relatedAgent)
            return agent?.alive ? "YES" : "NO"
          }
        )
        next = resolveMarkets(
          next,
          (market) => market.kind === "identify_impostor" && market.relatedAgent === event.ejected,
          (_, snapshot) => (snapshot.imposter === event.ejected ? "YES" : "NO")
        )

        return next
      })

      addFeedItem("EJECTION", `${event.ejected} was ejected`, "The crew has spoken")
      break
    }

    case "GAME_END": {
      setState((prev) => {
        let next: GameState = {
          ...prev,
          phase: "ended",
          winner: event.winner,
          imposter: event.imposter ?? null,
        }

        next = resolveMarkets(
          next,
          (market) => market.status !== "RESOLVED",
          (market, snapshot) => {
            if (market.kind === "crew_win") return event.winner === "crew" ? "YES" : "NO"
            if (market.kind === "identify_impostor")
              return market.relatedAgent === event.imposter ? "YES" : "NO"
            if (market.kind === "agent_survive_round") {
              const agent = snapshot.agents.find((a) => a.name === market.relatedAgent)
              return agent?.alive ? "YES" : "NO"
            }
            return "NO"
          }
        )

        return next
      })

      // Chess game end events have result field instead of imposter
      if ("result" in event) {
        // Chess game end
        const resultStr = event.result === "checkmate" ? "Checkmate" : "Stalemate"
        const winnerStr = event.winner === "draw" ? "Draw" : `${capitalize(event.winner as string)} wins`
        addFeedItem("GAME_END", `Game Over — ${winnerStr}`, resultStr)
      } else {
        addFeedItem(
          "GAME_END",
          event.winner === "crew" ? "Crew Wins!" : "Impostor Wins!",
          `The impostor was ${event.imposter}`
        )
      }
      break
    }

    // ------------------------------------------------------------------
    // Chess events
    // ------------------------------------------------------------------

    case "MOVE": {
      const from = toSquare(event.start)
      const to = toSquare(event.end)
      const piece = capitalize(event.piece)
      const player = capitalize(event.player)

      // Detect if it was a capture (the game emits target-square info)
      // For now, just show piece moves
      addFeedItem(
        "MOVE",
        `${piece} → ${to.toUpperCase()}`,
        `${player} · ${from.toUpperCase()} to ${to.toUpperCase()}`
      )

      // Update phase to running if we get moves
      setState((prev) => ({
        ...prev,
        phase: prev.phase === "waiting" ? "running" : prev.phase,
      }))
      break
    }

    case "CHECK": {
      addFeedItem(
        "CHECK",
        `${capitalize(event.king)} is in check!`,
        "King under attack"
      )
      break
    }

    case "CHECKMATE": {
      addFeedItem(
        "CHECKMATE",
        `Checkmate — ${capitalize(event.winner)} wins!`,
        `${capitalize(event.loser)} has no legal moves`
      )
      setState((prev) => ({ ...prev, phase: "ended" }))
      break
    }

    case "STALEMATE": {
      addFeedItem(
        "STALEMATE",
        "Stalemate — Draw!",
        `${capitalize(event.turn)} has no legal moves`
      )
      setState((prev) => ({ ...prev, phase: "ended" }))
      break
    }
  }
}

// ---------------------------------------------------------------------------
// Chess notation helpers
// ---------------------------------------------------------------------------

const COL_LETTERS = "abcdefgh"

function toSquare(coord: number[]): string {
  if (!coord || coord.length < 2) return "?"
  const [row, col] = coord
  const file = COL_LETTERS[col] ?? "?"
  const rank = 8 - row
  return `${file}${rank}`
}

function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function resetGame() {
  if (meetingUnlockTimer) clearTimeout(meetingUnlockTimer)
  setState(() => createInitialState())
}

export function useGameStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export const gameActions = {
  processEvent,
  submitPrediction,
  setConnectionStatus: (status: GameState["connectionStatus"]) =>
    setState((prev) => ({ ...prev, connectionStatus: status })),
  resetGame,
}

export function useGameActions() {
  return gameActions
}
