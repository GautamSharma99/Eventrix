// --- Event types from the WebSocket ---
export type GameEventType =
  | "GAME_START"
  | "KILL"
  | "MEETING_START"
  | "VOTE"
  | "EJECTION"
  | "GAME_END"

export interface GameStartEvent {
  type: "GAME_START"
  agents: string[]
  imposter?: string
}

export interface KillEvent {
  type: "KILL"
  killer: string
  victim: string
}

export interface MeetingStartEvent {
  type: "MEETING_START"
}

export interface VoteEvent {
  type: "VOTE"
  agent: string
  target: string
}

export interface EjectionEvent {
  type: "EJECTION"
  ejected: string
}

export interface GameEndEvent {
  type: "GAME_END"
  winner: "crew" | "imposter"
  imposter: string
}

export type GameEvent =
  | GameStartEvent
  | KillEvent
  | MeetingStartEvent
  | VoteEvent
  | EjectionEvent
  | GameEndEvent

// --- Feed item for the event log ---
export interface FeedItem {
  id: string
  timestamp: number
  type: GameEventType
  message: string
  details?: string
}

// --- Game phase ---
export type GamePhase = "waiting" | "running" | "meeting" | "ended"

// --- Agent ---
export interface Agent {
  name: string
  alive: boolean
  color: string
  ejected?: boolean
  killedAt?: number
  ejectedAt?: number
}

// --- Prediction Market ---
export type MarketStatus = "OPEN" | "FROZEN" | "RESOLVED"

export interface PredictionMarket {
  id: string
  question: string
  yesOdds: number
  noOdds: number
  status: MarketStatus
  resolved?: "YES" | "NO"
  createdAt: number
  relatedAgent?: string
}

// --- Token State ---
export interface PricePoint {
  time: number
  price: number
  label?: string
}

export interface TokenState {
  name: string
  ticker: string
  price: number
  priceHistory: PricePoint[]
  hypeScore: number
  userCredits: number
  userTokens: number
  gameActive: boolean
  cashedOut: boolean
}

// --- Game State ---
export interface GameState {
  phase: GamePhase
  agents: Agent[]
  feed: FeedItem[]
  markets: PredictionMarket[]
  imposter: string | null
  winner: "crew" | "imposter" | null
  connectionStatus: "connecting" | "connected" | "disconnected"
  token: TokenState
}
