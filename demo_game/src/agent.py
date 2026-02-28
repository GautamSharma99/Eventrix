"""
Chess Autonomous Agent Module.

Provides rule-based agents that can play chess without human input.
No AI/ML — purely algorithmic: random selection or simple heuristic scoring.

Usage:
    from agent import RandomAgent, HeuristicAgent
    agent = HeuristicAgent("black")
    move = agent.get_move(gs, "black")  # returns ((start_row, start_col), (end_row, end_col))
"""

import random
from abc import ABC, abstractmethod

from classes import Game_State, Queen, Castle, Bishop, Knight, Pawn, King


# ---------------------------------------------------------------------------
# Piece value table (for capture scoring)
# ---------------------------------------------------------------------------

PIECE_VALUES = {
    Queen: 9,
    Castle: 5,
    Bishop: 3,
    Knight: 3,
    Pawn: 1,
    King: 0,
}

# Centre squares get a bonus
CENTER_SQUARES = {(3, 3), (3, 4), (4, 3), (4, 4)}
EXTENDED_CENTER = {(2, 2), (2, 3), (2, 4), (2, 5),
                   (3, 2), (3, 5),
                   (4, 2), (4, 5),
                   (5, 2), (5, 3), (5, 4), (5, 5)}


def _piece_value(piece) -> int:
    """Return the material value of a piece, or 0 for unknown / empty."""
    for cls, val in PIECE_VALUES.items():
        if isinstance(piece, cls):
            return val
    return 0


def _all_valid_moves(gs: Game_State, color: str):
    """
    Yield every (start, end) legal move for the given color.

    Uses the existing get_valid_moves() method on each piece,
    which already filters out king-exposing moves via squareUnderAttack.
    """
    pieces = gs.white_pieces if color == "white" else gs.black_pieces
    for piece in list(pieces):               # copy list — safe iteration
        start = gs.get_pos(piece)
        if start is None:
            continue
        for end in piece.get_valid_moves(start, gs, color):
            yield (start, end)


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------

class ChessAgent(ABC):
    """Abstract base for a chess-playing agent."""

    def __init__(self, color: str):
        """
        :param color: "white" or "black"
        """
        self.color = color

    @abstractmethod
    def get_move(self, gs: Game_State, turn: str):
        """
        Choose a move for the given game state.

        :param gs:   Current Game_State
        :param turn: Current turn color ("white" or "black")
        :return:     (start, end) tuple, or None if no legal moves exist
        """
        ...


# ---------------------------------------------------------------------------
# Random Agent
# ---------------------------------------------------------------------------

class RandomAgent(ChessAgent):
    """
    Picks a uniformly random legal move.

    No strategy at all — useful as a baseline and for testing.
    """

    def get_move(self, gs: Game_State, turn: str):
        moves = list(_all_valid_moves(gs, turn))
        if not moves:
            return None
        return random.choice(moves)


# ---------------------------------------------------------------------------
# Heuristic Agent
# ---------------------------------------------------------------------------

class HeuristicAgent(ChessAgent):
    """
    Scores every legal move with a simple heuristic and picks the best.

    Scoring priorities (descending):
      1. Capture value of victim piece (Q=9, R=5, B=N=3, P=1)
      2. Centre control bonus (+0.5 for d4/d5/e4/e5, +0.2 for extended centre)
      3. Random tiebreak
    """

    def get_move(self, gs: Game_State, turn: str):
        moves = list(_all_valid_moves(gs, turn))
        if not moves:
            return None

        scored = []
        for start, end in moves:
            score = 0.0

            # Capture bonus
            target = gs.board[end[0]][end[1]]
            if target != "--":
                score += _piece_value(target)

            # Centre control bonus
            if end in CENTER_SQUARES:
                score += 0.5
            elif end in EXTENDED_CENTER:
                score += 0.2

            # Small random tiebreak so games vary
            score += random.random() * 0.1

            scored.append((score, start, end))

        scored.sort(key=lambda x: x[0], reverse=True)
        _, best_start, best_end = scored[0]
        return (best_start, best_end)
