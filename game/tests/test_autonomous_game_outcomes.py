import os
import sys
import unittest
import importlib.util
from pathlib import Path


GAME_DIR = Path(__file__).resolve().parents[1]
if str(GAME_DIR) not in sys.path:
    sys.path.insert(0, str(GAME_DIR))

_orig_cwd = os.getcwd()
os.chdir(str(GAME_DIR))
# `autonomous_game.py` expects `from game import Game`, where `game` is
# the sibling module file `game.py` in this directory.
_existing_game_module = sys.modules.get("game")
game_spec = importlib.util.spec_from_file_location("game", GAME_DIR / "game.py")
game_module = importlib.util.module_from_spec(game_spec)
assert game_spec and game_spec.loader
game_spec.loader.exec_module(game_module)
sys.modules["game"] = game_module
import autonomous_game as ag
if _existing_game_module is not None:
    sys.modules["game"] = _existing_game_module
else:
    del sys.modules["game"]
os.chdir(_orig_cwd)


class FakeAgentRuntime:
    def __init__(self, roles):
        self.roles = roles

    def role_for(self, colour):
        return self.roles.get(colour, "CREW")


class FakeEventRuntime:
    def __init__(self):
        self.calls = []

    def on_game_end(self, winner, imposter, alive_agents):
        self.calls.append((winner, imposter, tuple(alive_agents)))


class AutonomousGameOutcomeTests(unittest.TestCase):
    def _make_game(self, roles, alive, imposter="Red"):
        game = ag.AutonomousGame.__new__(ag.AutonomousGame)
        game.agent_runtime = FakeAgentRuntime(roles)
        game.event_runtime = FakeEventRuntime()
        game.imposter_colour = imposter
        game.winner = None
        game.game_over = False
        game.tick = 0
        game.event_log = []
        game.alive_colours = lambda: list(alive)
        return game

    def test_check_win_crew_path_sets_winner_and_emits_game_end(self):
        game = self._make_game(
            roles={"Red": "CREW", "Blue": "CREW", "Green": "CREW"},
            alive=["Red", "Blue", "Green"],
            imposter="Yellow",
        )

        did_end = game._check_win()

        self.assertTrue(did_end)
        self.assertTrue(game.game_over)
        self.assertEqual(game.winner, "CREW")
        self.assertIn(("CREW", "Yellow", ("Red", "Blue", "Green")), game.event_runtime.calls)

    def test_check_win_imposter_path_sets_winner_and_emits_game_end(self):
        game = self._make_game(
            roles={"Red": "IMPOSTER", "Blue": "CREW"},
            alive=["Red", "Blue"],
            imposter="Red",
        )

        did_end = game._check_win()

        self.assertTrue(did_end)
        self.assertTrue(game.game_over)
        self.assertEqual(game.winner, "IMPOSTER")
        self.assertIn(("IMPOSTER", "Red", ("Red", "Blue")), game.event_runtime.calls)


if __name__ == "__main__":
    unittest.main()
