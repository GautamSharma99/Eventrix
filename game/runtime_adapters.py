"""
Runtime adapters for AutonomousGame.

This module isolates "who decides actions" and "where events go" from
the game loop. The game remains authoritative for validation and state
transitions, while adapters can inject behavior and handle side-effects.
"""
from __future__ import annotations

import os
import random
import threading
from typing import Any, Protocol

import pygame as pg

from agent_controller import SimpleAgent
from bnb.blockchain import MonadSusChainIntegration
from frame_streamer import FrameStreamer
from ws_emitter import GameEmitter


class AgentRuntime(Protocol):
    def initialize(self, colours: list[str], imposter_colour: str) -> None: ...
    def role_for(self, colour: str) -> str: ...
    def get_action(self, colour: str, observation: dict[str, Any]) -> dict[str, Any]: ...
    def reset_vote(self, colour: str) -> None: ...


class LocalAgentRuntime:
    """
    Legacy local agent runtime.

    Uses the existing in-process rule-based agents (or optional OpenClaw).
    This preserves current behavior while allowing the game to depend on
    an interface instead of concrete agent classes.
    """

    def __init__(self, agent_mode: str | None = None):
        self.agent_mode = (agent_mode or os.environ.get("AGENT_MODE", "simple")).lower()
        self._agents: dict[str, Any] = {}
        self._roles: dict[str, str] = {}

    def initialize(self, colours: list[str], imposter_colour: str) -> None:
        self._agents.clear()
        self._roles.clear()
        for colour in colours:
            role = "IMPOSTER" if colour == imposter_colour else "CREW"
            self._roles[colour] = role

            if self.agent_mode == "openclaw":
                try:
                    from openclaw_agent import OpenClawAgentController

                    personality = self._assign_personality(role)
                    self._agents[colour] = OpenClawAgentController(
                        agent_id=colour,
                        role=role,
                        personality_type=personality,
                    )
                    continue
                except Exception:
                    # Fall back to deterministic rule-based behavior.
                    pass

            self._agents[colour] = SimpleAgent(agent_id=colour, role=role)

    def role_for(self, colour: str) -> str:
        return self._roles.get(colour, "CREW")

    def get_action(self, colour: str, observation: dict[str, Any]) -> dict[str, Any]:
        agent = self._agents.get(colour)
        if agent is None:
            return {"type": "NONE"}
        try:
            return agent.get_action(observation)
        except Exception:
            return {"type": "NONE"}

    def reset_vote(self, colour: str) -> None:
        agent = self._agents.get(colour)
        if agent is not None and hasattr(agent, "reset_vote"):
            agent.reset_vote()

    @staticmethod
    def _assign_personality(role: str) -> str:
        if role == "IMPOSTER":
            return random.choice(["aggressive", "subtle"])
        return random.choice(["detective", "follower", "balanced"])


class EventRuntime(Protocol):
    def on_game_start(self, agents: list[str], imposter: str) -> None: ...
    def on_kill(self, killer: str, victim: str) -> None: ...
    def on_meeting_start(self, caller: str) -> None: ...
    def on_agent_spoke(self, agent: str, message: str) -> None: ...
    def on_vote_cast(self, voter: str, target: str | None) -> None: ...
    def on_ejection(self, ejected: str, was_imposter: bool) -> None: ...
    def on_game_end(self, winner: str, imposter: str, alive_agents: list[str]) -> None: ...
    def on_pre_game_trading_start(self) -> None: ...
    def on_game_actually_start(self) -> None: ...
    def stream_frame(self, surface: pg.Surface) -> None: ...
    def close(self) -> None: ...


class NullEventRuntime:
    """No-op event runtime for local deterministic runs without integrations."""

    def on_game_start(self, agents: list[str], imposter: str) -> None:
        return

    def on_kill(self, killer: str, victim: str) -> None:
        return

    def on_meeting_start(self, caller: str) -> None:
        return

    def on_agent_spoke(self, agent: str, message: str) -> None:
        return

    def on_vote_cast(self, voter: str, target: str | None) -> None:
        return

    def on_ejection(self, ejected: str, was_imposter: bool) -> None:
        return

    def on_game_end(self, winner: str, imposter: str, alive_agents: list[str]) -> None:
        return

    def on_pre_game_trading_start(self) -> None:
        return

    def on_game_actually_start(self) -> None:
        return

    def stream_frame(self, surface: pg.Surface) -> None:
        return

    def close(self) -> None:
        return


class LegacyEventRuntime:
    """
    Legacy runtime wiring for chain, bridge events, and video streaming.

    This adapter centralizes external side-effects so the game loop only
    emits domain events and applies authoritative state transitions.
    """

    def __init__(self):
        live_mode = os.environ.get("MONAD_LIVE_MODE", "").lower() in ("1", "true", "yes")
        bridge_game_id = os.environ.get("BRIDGE_GAME_ID", "game-001")
        self.chain = MonadSusChainIntegration(live_mode=live_mode)
        self.emitter = GameEmitter(bridge_game_id)
        self.frame_streamer = FrameStreamer(game_id=bridge_game_id)

    def on_game_start(self, agents: list[str], imposter: str) -> None:
        self.chain.on_game_start(agents, imposter)
        self.emitter.game_start(agents, imposter)

    def on_kill(self, killer: str, victim: str) -> None:
        self.chain.logger.log_kill(killer, victim)
        self.emitter.kill(killer, victim)

    def on_meeting_start(self, caller: str) -> None:
        self.chain.logger.log_meeting(caller)
        self.emitter.meeting_start(caller)
        self._trigger_ai_questions()

    def _trigger_ai_questions(self) -> None:
        def task():
            try:
                import requests
                import json
                # Get last N events to context window
                events = self.chain.logger.events[-30:]
                if not events:
                    return
                
                print("  [AI] Fetching dynamic prediction markets from Next.js server...")
                logs = "\n".join([json.dumps(e.to_dict()) for e in events])
                
                # Default NextJS port is 3000
                api_url = os.environ.get("NEXT_PUBLIC_FRONTEND_URL", "http://localhost:3000") + "/api/ai-model"
                resp = requests.post(api_url, json={"logs": logs}, timeout=15)
                
                if resp.status_code == 200:
                    data = resp.json()
                    questions = data.get("questions", [])
                    for q in questions:
                        print(f"  [AI] Dynamic Market Created: {q}")
                        if self.chain.game_id is not None:
                            # Push market to chain automatically
                            m_id = self.chain.connector.create_market(self.chain.game_id, q)
                            self.chain.markets[f"DYNAMIC_{m_id}"] = m_id
                else:
                    print(f"  [AI] Server returned {resp.status_code}: {resp.text}")
            except Exception as e:
                print(f"  [AI] Failed to generate dynamic questions: {e}")
                
        threading.Thread(target=task, daemon=True).start()

    def on_agent_spoke(self, agent: str, message: str) -> None:
        self.chain.logger.log_speak(agent, message)
        self.emitter.agent_spoke(agent, message)

    def on_vote_cast(self, voter: str, target: str | None) -> None:
        self.chain.logger.log_vote(voter, target)
        self.emitter.vote_cast(voter, target)

    def on_ejection(self, ejected: str, was_imposter: bool) -> None:
        self.chain.logger.log_eject(ejected, was_imposter)
        self.emitter.ejection(ejected, was_imposter)

    def on_game_end(self, winner: str, imposter: str, alive_agents: list[str]) -> None:
        winner_lower = winner.lower()
        self.emitter.game_end(winner_lower, imposter)
        self.chain.on_game_end(winner, imposter, alive_agents)

    def on_pre_game_trading_start(self) -> None:
        self.chain.on_pre_game_trading_start()

    def on_game_actually_start(self) -> None:
        self.chain.on_game_actually_start()

    def stream_frame(self, surface: pg.Surface) -> None:
        self.frame_streamer.submit(surface)

    def close(self) -> None:
        try:
            self.frame_streamer.close()
        except Exception:
            pass
        try:
            self.emitter.close()
        except Exception:
            pass


def build_event_runtime() -> EventRuntime:
    mode = os.environ.get("SUS_EVENT_RUNTIME", "legacy").strip().lower()
    if mode in {"none", "off", "null"}:
        return NullEventRuntime()
    return LegacyEventRuntime()

