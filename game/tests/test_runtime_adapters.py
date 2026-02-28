import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


GAME_DIR = Path(__file__).resolve().parents[1]
if str(GAME_DIR) not in sys.path:
    sys.path.insert(0, str(GAME_DIR))

import runtime_adapters as ra


class DummyLogger:
    def __init__(self):
        self.calls = []

    def log_kill(self, killer, victim):
        self.calls.append(("kill", killer, victim))

    def log_meeting(self, caller):
        self.calls.append(("meeting", caller))

    def log_speak(self, agent, message):
        self.calls.append(("speak", agent, message))

    def log_vote(self, voter, target):
        self.calls.append(("vote", voter, target))

    def log_eject(self, ejected, was_imposter):
        self.calls.append(("eject", ejected, was_imposter))


class DummyChain:
    def __init__(self, live_mode=False):
        self.live_mode = live_mode
        self.logger = DummyLogger()
        self.calls = []

    def on_game_start(self, agents, imposter):
        self.calls.append(("start", tuple(agents), imposter))

    def on_game_end(self, winner, imposter, alive_agents):
        self.calls.append(("end", winner, imposter, tuple(alive_agents)))

    def on_pre_game_trading_start(self):
        self.calls.append(("pre_game",))

    def on_game_actually_start(self):
        self.calls.append(("lock_trading",))


class DummyEmitter:
    def __init__(self, game_id):
        self.game_id = game_id
        self.calls = []

    def game_start(self, agents, imposter):
        self.calls.append(("game_start", tuple(agents), imposter))

    def kill(self, killer, victim):
        self.calls.append(("kill", killer, victim))

    def meeting_start(self, caller):
        self.calls.append(("meeting_start", caller))

    def agent_spoke(self, agent, message):
        self.calls.append(("agent_spoke", agent, message))

    def vote_cast(self, voter, target):
        self.calls.append(("vote_cast", voter, target))

    def ejection(self, ejected, was_imposter):
        self.calls.append(("ejection", ejected, was_imposter))

    def game_end(self, winner, imposter):
        self.calls.append(("game_end", winner, imposter))

    def close(self):
        self.calls.append(("close",))


class DummyFrameStreamer:
    def __init__(self, game_id="game-001"):
        self.game_id = game_id
        self.calls = []

    def submit(self, surface):
        self.calls.append(("submit", surface))

    def close(self):
        self.calls.append(("close",))


class RuntimeAdaptersTests(unittest.TestCase):
    def test_local_agent_runtime_assigns_roles_and_actions(self):
        runtime = ra.LocalAgentRuntime(agent_mode="simple")
        runtime.initialize(["Red", "Blue"], "Red")

        self.assertEqual(runtime.role_for("Red"), "IMPOSTER")
        self.assertEqual(runtime.role_for("Blue"), "CREW")

        action = runtime.get_action(
            "Red",
            {
                "position": (0, 0),
                "meeting_active": False,
                "can_kill": False,
                "nearby_agents": [],
                "alive_agents": ["Blue"],
                "dead_agents": [],
            },
        )
        self.assertIn(action.get("type"), {"MOVE", "KILL", "VOTE", "SPEAK", "NONE"})

    def test_local_agent_runtime_returns_none_on_agent_error(self):
        class BrokenAgent:
            def __init__(self, agent_id, role):
                self.agent_id = agent_id
                self.role = role

            def get_action(self, observation):
                raise RuntimeError("boom")

            def reset_vote(self):
                return None

        with patch.object(ra, "SimpleAgent", BrokenAgent):
            runtime = ra.LocalAgentRuntime(agent_mode="simple")
            runtime.initialize(["Red"], "Red")
            action = runtime.get_action("Red", {"meeting_active": False, "position": (0, 0)})
            self.assertEqual(action, {"type": "NONE"})

    def test_build_event_runtime_returns_null_runtime_when_disabled(self):
        with patch.dict(os.environ, {"SUS_EVENT_RUNTIME": "none"}, clear=False):
            runtime = ra.build_event_runtime()
            self.assertIsInstance(runtime, ra.NullEventRuntime)

    def test_legacy_event_runtime_routes_calls_to_dependencies(self):
        with patch.object(ra, "MonadSusChainIntegration", DummyChain), patch.object(
            ra, "GameEmitter", DummyEmitter
        ), patch.object(ra, "FrameStreamer", DummyFrameStreamer):
            runtime = ra.LegacyEventRuntime()

            runtime.on_game_start(["Red", "Blue"], "Red")
            runtime.on_kill("Red", "Blue")
            runtime.on_meeting_start("Blue")
            runtime.on_agent_spoke("Red", "skip")
            runtime.on_vote_cast("Blue", "Red")
            runtime.on_ejection("Red", True)
            runtime.on_pre_game_trading_start()
            runtime.on_game_actually_start()
            runtime.on_game_end("CREW", "Red", ["Blue"])
            surface = object()
            runtime.stream_frame(surface)
            runtime.close()

            self.assertIn(("start", ("Red", "Blue"), "Red"), runtime.chain.calls)
            self.assertIn(("end", "CREW", "Red", ("Blue",)), runtime.chain.calls)
            self.assertIn(("pre_game",), runtime.chain.calls)
            self.assertIn(("lock_trading",), runtime.chain.calls)

            self.assertIn(("game_start", ("Red", "Blue"), "Red"), runtime.emitter.calls)
            self.assertIn(("game_end", "crew", "Red"), runtime.emitter.calls)
            self.assertIn(("close",), runtime.emitter.calls)

            self.assertIn(("kill", "Red", "Blue"), runtime.chain.logger.calls)
            self.assertIn(("meeting", "Blue"), runtime.chain.logger.calls)
            self.assertIn(("speak", "Red", "skip"), runtime.chain.logger.calls)
            self.assertIn(("vote", "Blue", "Red"), runtime.chain.logger.calls)
            self.assertIn(("eject", "Red", True), runtime.chain.logger.calls)

            self.assertIn(("submit", surface), runtime.frame_streamer.calls)
            self.assertIn(("close",), runtime.frame_streamer.calls)


if __name__ == "__main__":
    unittest.main()
