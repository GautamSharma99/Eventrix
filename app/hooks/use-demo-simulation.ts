"use client"

import { useCallback, useRef } from "react"
import { gameActions } from "./use-game-store"
import type { GameEvent } from "@/lib/game-types"

const AGENTS = [
  "Atlas",
  "Nova",
  "Cipher",
  "Echo",
  "Pulse",
  "Drift",
  "Flare",
  "Onyx",
]

const IMPOSTER = "Cipher"

function randomAgent(exclude: string[], agents: string[]): string {
  const valid = agents.filter((a) => !exclude.includes(a))
  return valid[Math.floor(Math.random() * valid.length)]
}

export function useDemoSimulation() {
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const runningRef = useRef(false)

  const stop = useCallback(() => {
    runningRef.current = false
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
  }, [])

  const start = useCallback(() => {
    stop()
    gameActions.resetGame()
    runningRef.current = true
    gameActions.setConnectionStatus("connected")

    const alive = [...AGENTS]
    const dead: string[] = []
    let delay = 0

    function schedule(event: GameEvent, ms: number) {
      delay += ms
      const t = setTimeout(() => {
        if (!runningRef.current) return
        gameActions.processEvent(event)
      }, delay)
      timerRef.current.push(t)
    }

    // GAME_START
    schedule(
      { type: "GAME_START", agents: [...AGENTS], imposter: IMPOSTER },
      500
    )

    // First KILL
    const victim1 = randomAgent([IMPOSTER], alive)
    schedule({ type: "KILL", killer: IMPOSTER, victim: victim1 }, 3000)
    alive.splice(alive.indexOf(victim1), 1)
    dead.push(victim1)

    // MEETING
    schedule({ type: "MEETING_START" }, 4000)

    // Votes
    const aliveForVote1 = [...alive]
    for (const agent of aliveForVote1) {
      const target = randomAgent([agent], aliveForVote1)
      schedule({ type: "VOTE", agent, target }, 800)
    }

    // Eject a random (not the imposter this round)
    const ejected1 = randomAgent([IMPOSTER], alive)
    schedule({ type: "EJECTION", ejected: ejected1 }, 2000)
    alive.splice(alive.indexOf(ejected1), 1)
    dead.push(ejected1)

    // Second KILL
    const victim2 = randomAgent([IMPOSTER], alive)
    schedule({ type: "KILL", killer: IMPOSTER, victim: victim2 }, 3500)
    alive.splice(alive.indexOf(victim2), 1)
    dead.push(victim2)

    // Second MEETING
    schedule({ type: "MEETING_START" }, 4000)

    const aliveForVote2 = [...alive]
    for (const agent of aliveForVote2) {
      schedule(
        { type: "VOTE", agent, target: IMPOSTER },
        700
      )
    }

    // Eject the imposter
    schedule({ type: "EJECTION", ejected: IMPOSTER }, 2000)
    alive.splice(alive.indexOf(IMPOSTER), 1)

    // Game end - crew wins
    schedule(
      { type: "GAME_END", winner: "crew", imposter: IMPOSTER },
      2000
    )

    return stop
  }, [stop])

  return { start, stop }
}
