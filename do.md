
# PRD — Live Autonomous Game Streaming + Prediction Markets UI

## 1. Overview

Build a **spectator-first web platform** where autonomous *Among Us–style* games run externally (Pygame, local/remote), and are streamed in real time to a **Next.js app** via WebSockets.

Users can:

* Watch multiple live games
* Enter a specific game stream
* See real-time game events (kills, meetings, votes)
* Interact with **prediction markets and token launches** that appear dynamically during the game
* Start a game from the web UI

The game engine is **authoritative**.
The web UI is **reactive**, not controlling gameplay logic.

---

## 2. Goals

### Primary Goals

* Stream live autonomous gameplay to the web in real time
* Support multiple simultaneous games (streams)
* Dynamically create prediction markets during gameplay
* Enable users to start games from the UI

### Non-Goals

* No human gameplay control
* No video streaming (event-driven, not pixel streaming)
* No on-chain settlement in v1 (hooks only)

---

## 3. User Personas

### Spectator (Primary)

* Crypto-native
* Enjoys watching agents play
* Wants to trade / bet based on live behavior
* Needs fast, responsive UI

### Game Operator (Secondary)

* Starts games
* Monitors streams
* Debugs agent behavior

---

## 4. System Architecture

```
[Pygame Game Engine] (authoritative)
        |
        | emits events
        v
[Game Event Server] (WebSocket + REST)
        |
        | broadcasts
        v
[Next.js App]
   ├── Dashboard (multi-stream)
   ├── Game View (single stream)
   └── Prediction Markets UI
```

### Key Principle

**One-way real-time data flow**

* Game → Web
* Web can only send *commands* like `START_GAME`

---

## 5. Game Event Protocol

All communication uses **semantic events**, not frames.

### Core Events

```json
GAME_CREATED
GAME_STARTED
AGENT_KILLED
MEETING_STARTED
AGENT_SPOKE
VOTE_CAST
AGENT_EJECTED
GAME_ENDED
```

Each event includes:

* `game_id`
* `timestamp`
* `payload` (agent IDs, reasons, etc.)

This protocol is shared between backend and frontend.

---

## 6. Feature Requirements

---

### FR-1: Multi-Game Dashboard (Screenshot 1)

**Description**
A homepage listing:

* Live games
* Starting games
* Upcoming games

**Each card shows**

* Game name / map
* Status (LIVE / STARTING / UPCOMING)
* Viewer count
* Token price or hype metric
* “Watch” CTA

**Acceptance Criteria**

* Games update live via WebSocket
* Clicking a card navigates to game view

---

### FR-2: Single Game View (Screenshot 2)

**Description**
When a user enters a game:

* Live game feed is shown
* Event log updates in real time
* Prediction markets panel is visible

**Sections**

* Game status bar (time, agents alive)
* Event feed (kills, meetings, dialogue)
* Prediction markets container
* Token launchpad entry

**Acceptance Criteria**

* Events appear within <200ms
* UI updates without refresh

---

### FR-3: Game Streaming via WebSocket

**Description**
The game engine pushes events to a WebSocket server.
Frontend subscribes to:

```
ws://server/ws/game/{game_id}
```

**Acceptance Criteria**

* Reconnect on refresh
* Graceful disconnect handling
* No duplicate events

---

### FR-4: Start Game from Next.js UI

**Description**
User can click “Run Demo” / “Start Game”.

**Flow**

1. Next.js sends REST call: `POST /game/start`
2. Backend spawns game process
3. Game emits `GAME_STARTED`
4. UI transitions to live state

**Acceptance Criteria**

* Game starts without page reload
* UI reflects state change instantly

---

### FR-5: Dynamic Prediction Markets

**Description**
Prediction markets appear **based on game events**, not manually.

**Examples**

* On `GAME_STARTED`

  * “Will the Crew win?”
* On first `AGENT_KILLED`

  * “Is Agent X the Impostor?”
  * “Will Agent X survive?”
* On `MEETING_STARTED`

  * Voting-related markets

**Market Properties**

* Question
* YES / NO actions
* Status: OPEN / FROZEN / RESOLVED
* Timer tied to game lifecycle

**Acceptance Criteria**

* Markets appear automatically
* Markets freeze on `GAME_ENDED`

---

### FR-6: Token Launch During Game

**Description**
Each game can spawn **temporary tokens** during its lifetime.

**Rules**

* Token exists only while game is live
* Tradeable during game
* Frozen and settled at game end

**Acceptance Criteria**

* Token UI appears in-game
* No interaction after game ends

---

## 7. State Management (Frontend)

Global state tracks:

* Active games list
* Current game state
* Agents alive/dead
* Event feed history
* Active markets
* Token status

State updates are driven **only by WebSocket events**.

---

## 8. Backend Responsibilities

* Manage active game processes
* Maintain game → socket event pipeline
* Fan-out events to subscribers
* Expose REST APIs:

  * `POST /game/start`
  * `GET /games`
  * `GET /game/{id}`

---

## 9. UX Requirements

* Dark, immersive theme
* Subtle animations for new events
* Non-blocking market popups
* Clear spectator-only labeling
* Mobile-friendly layout (read-only)

---

## 10. Security & Constraints

* No client → game mutation beyond `START_GAME`
* Event validation server-side
* Rate-limit start-game requests
* No direct socket access to game process

---

## 11. Success Metrics

* Multiple games streaming concurrently
* Zero game desyncs
* Users can watch, enter, and trade without reload
* One full match from start → end works live

---

## 12. V1 Definition of Done

* Dashboard lists live games
* Clicking a game opens live stream
* Game events stream in real time
* Prediction markets appear dynamically
* Game can be started from UI
* Game ends cleanly and UI resolves state


### One-liner summary (keep this handy)

> An event-driven, spectator-first platform where autonomous games stream live to the web and spawn prediction markets as the game unfolds.


