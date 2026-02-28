# Chess Game — Engine Behavior & Architecture

This document explains how the chess demo game (`demo_game/`) implements board logic, move validation, piece behavior, and end-condition detection. The entire system relies on **rule-based move generation**, **pseudo-move simulation**, and **classical game-tree checks** — no AI or machine learning is used.

## Overview

The chess engine is built entirely on **classical programming techniques**:

- **Piece-specific move generators** for all 6 piece types
- **Pseudo-move simulation** for legal-move filtering (king-safety checks)
- **Two-pointer validation** for castling legality
- **Attribute-based state tracking** for en passant, castling rights, and pawn promotion
- **Turn-based finite state machine** for the game loop

No neural networks, no minimax search, no alpha-beta pruning — just pure rule-based logic.

---

## Core Architecture

### Module Overview

```
demo_game/
├── src/
│   ├── main.py        # Game loop, move execution, checkmate/stalemate detection
│   ├── classes.py     # All data classes: Game_State, Piece subclasses, UI sprites
│   └── test.py        # pytest-style tests for checkmate, move, stalemate
└── assets/
    ├── images/        # Piece PNG sprites (wK, bQ, wp, etc.)
    └── sounds/        # move-self.mp3, capture.mp3, castle.mp3
```

### Game Loop State Machine

The `main()` loop in `main.py` is a two-state finite state machine:

```
┌─────────────────────────────────────────────────────┐
│                    IDLE / START                     │
│  Screen: white background + "Hit Space to Start"   │
│  Transition: SPACE key → active = True             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  PLAYING (active)                   │
│  - Draw board squares + pieces                     │
│  - Handle mouse click → select / move              │
│  - Highlight valid moves (grey circles)            │
│  - Highlight king square red when in check         │
│  - Check checkmate / stalemate each turn           │
│  Transition: checkmate or stalemate → active = False│
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               GAME OVER (not active)                │
│  Screen: "White/Black Lose" or "Stalemate"         │
│  Transition: SPACE key → new Game_State, restart   │
└─────────────────────────────────────────────────────┘
```

---

## Game State (`Game_State`)

`Game_State` is the central data structure. It owns:

| Attribute | Type | Purpose |
|---|---|---|
| `board` | `list[list[Piece \| str]]` | 8×8 grid; `"--"` for empty squares |
| `white_pieces` | `list[Piece]` | All living white pieces |
| `black_pieces` | `list[Piece]` | All living black pieces |
| `whiteKing` | `tuple(row, col)` | Current white king position |
| `blackKing` | `tuple(row, col)` | Current black king position |
| `board_state` | `list[list]` | Snapshot of board after a two-square pawn advance (for en passant detection) |

### Initial Board Layout

White is at rows 6–7 (bottom), black at rows 0–1 (top). The board initialises as:

```
Row 0: bR  bN  bB  bQ  bK  bB  bN  bR   (black back rank)
Row 1: bp  bp  bp  bp  bp  bp  bp  bp   (black pawns)
Row 2-5: -- (empty)
Row 6: wp  wp  wp  wp  wp  wp  wp  wp   (white pawns)
Row 7: wR  wN  wB  wQ  wK  wB  wN  wR  (white back rank)
```

Coordinate system: `(row, col)` where `(0,0)` is top-left.

---

## Piece Classes & Move Generation

All pieces inherit from the `Piece` base class. Each implements two methods:

```
get_moves(pos, board)       → list[(row, col)]   # pseudo-legal moves (ignores check)
get_valid_moves(pos, gs, turn) → list[(row, col)] # legal moves (filters out king-exposing moves)
```

By default, `get_valid_moves` delegates to `gs.squareUnderAttack(pos, turn)`.

### Piece-Specific Move Rules

#### King
- Moves one square in any of 8 directions
- **Castling**: Available if `self.castling == True` and `self.check == False` and king is at `start_pos`:
  - **Kingside**: Two empty squares to the right + Rook with `castling == True` at `y+3`
  - **Queenside**: Three empty squares to the left + Rook with `castling == True` at `y-4`
- `get_valid_moves` additionally filters castling squares where the intermediate square is not also legal (two-pointer sweep to prevent castling through check)
- Both `King.castling` and `Castle.castling` are set to `False` on first move

#### Queen
- Slides in all 8 directions (horizontal, vertical, diagonal)
- Stops at board edge, friendly piece (excluded), or opponent piece (included as capture)

#### Rook (`Castle`)
- Slides in 4 cardinal directions (horizontal and vertical only)
- Same blocking rules as Queen
- Tracks `start_pos` (set at `Game_State.__init__`) for castling eligibility

#### Bishop
- Slides in 4 diagonal directions
- Same blocking rules as Queen

#### Knight
- L-shaped jumps: 8 potential offsets computed from `(±2·direction, ±1)` and `(±1·direction, ±2)`, where `direction = -1` for white, `+1` for black
- Jumps over pieces; only blocked by friendly pieces at destination

#### Pawn
Key attributes:
- `direction`: `-1` (white, moves up) or `+1` (black, moves down)
- `start_row`: `6` (white) or `1` (black)
- `move_count`: number of moves made
- `current_row`: updated each move
- `en_passant`: `True` only after a two-square first move, for exactly one subsequent turn

Move rules:
1. **One square forward**: if the square ahead is empty
2. **Two squares forward**: only if `move_count == 0` and both squares are empty
3. **Diagonal capture**: if destination contains an opponent piece
4. **En passant capture**: if an adjacent pawn has `en_passant == True`

**Pawn Promotion**: Triggered when a pawn reaches `row == 0` or `row == 7`. A `Rectangle` dropdown appears; the player selects the promotion piece. The old pawn is replaced in `board` and the piece list.

---

## Legal Move Filtering — `squareUnderAttack`

This is how the engine enforces the "you cannot move into check" rule:

```python
for each pseudo-legal move:
    captured = pseudo_move([start, move])   # temporarily apply move
    for each opponent piece:
        if king_position in opponent.get_moves(...):
            is_valid = False                 # move exposes king
    undo_move([start, move], captured)       # revert board
    if is_valid:
        valid_moves.append(move)
```

`pseudo_move` and `undo_move` are non-destructive board mutations that temporarily alter `board`, `white_pieces`, `black_pieces`, and king position tracking — then fully restore them.

---

## Check Detection — `if_Check`

```python
def if_Check(self, turn):
    if turn == "white":
        for piece in self.black_pieces:
            if self.whiteKing in piece.get_moves(pos, board):
                return True
    # mirror for black
    return False
```

The king square is compared against every opponent's raw (pseudo-legal) moves. This runs every frame during play to highlight the king's square in red.

---

## Move Execution — `move_piece`

`move_piece(Player_click, gs, turn)` applies a confirmed two-click selection `[start, end]` and returns `True` on success, `False` if the move is invalid.

### Execution Order

1. **En passant expiry check**: if the board changed since the tracked en passant pawn moved, clear its flag
2. **Location set cleanup**: remove captured square from `white_location` / `black_location` sets
3. **Validate**: call `piece.get_valid_moves(start, gs, turn)` — reject if `end` not in result
4. **Rook castling rights**: clear `Castle.castling = False` on first rook move
5. **King tracking**: update `gs.whiteKing` / `gs.blackKing`; clear `King.castling = False`
6. **Castling execution**: if king moved 2 squares, relocate the rook to the correct side, update location sets
7. **Pawn special moves**:
   - Update `current_row` and `move_count`
   - If first move and advanced 2 rows: set `en_passant = True`, save `board_state` snapshot
   - If reaching promotion row: set `pawn_promotion = True`, create `Rectangle` dropdown
   - Check for en passant capture: remove the captured pawn from board and piece list
8. **Standard move**: swap `board[start]` → `"--"` and `board[end]` → piece
9. **Capture cleanup**: remove captured piece from `white_pieces` / `black_pieces`
10. **Sound**: play `capture_sound`, `castle_sound`, or `move_sound`

---

## End Conditions

### Checkmate — `checkMate(gamestate, turn)`

```
1. Is the current turn's king in check? (if_Check)
2. If yes: does ANY piece of that color have at least one valid move?
3. If no valid moves exist → CHECKMATE → active = False
```

The screen shows `"[color] Lose"` in red.

### Stalemate — `staleMate(gamestate, turn)`

```
1. Does ANY piece of the current turn's color have at least one valid move?
2. If none exist (regardless of check status) → STALEMATE → active = False
```

The screen shows `"Stalemate"` in red.

Both conditions are evaluated **after every successful move** (end of the opponent's turn).

---

## Input & Selection System

The game tracks two module-level globals: `Selected` (current square) and `Player_click` (list of two clicks). Mouse interaction follows these rules:

1. **Click on own piece** → set `Selected`, prime `Player_click[0]`
2. **Click same square again** → deselect (clear `Selected` and circles)
3. **Click different own piece** → switch selection
4. **Click any other square** → append to `Player_click[1]`, trigger `move_piece`
5. **Valid move dot display**: on first click, `Circle` sprites are drawn over every square in `get_valid_moves()`

Location sets `white_location` and `black_location` are updated by `draw_pieces()` every frame (rebuild from board scan).

---

## Sound Effects

| Event | File |
|---|---|
| Normal move | `move-self.mp3` |
| Capture | `capture.mp3` |
| Castling | `castle.mp3` |

---

## Testing (`test.py`)

Three `pytest`-style functions cover the core logic:

| Test | What it verifies |
|---|---|
| `test_checkMate()` | Known Scholar's-Mate-style board → `checkMate(gs, "white") == True` |
| `test_move_piece()` | Valid pawn push returns `True`; King move into check returns `False` |
| `test_staleMate()` | King+Queen vs. King lone-king-in-corner position → `staleMate` returns truthy |

Run from `demo_game/src/`:

```bash
pytest test.py -v
```

---

## Why This Is Not AI

| Aspect | AI/ML Approach | This Implementation |
|---|---|---|
| Move selection | Neural network / minimax | Human mouse input only |
| Move validation | Learned constraints | Explicit rule-based filtering |
| Strategy | Reinforcement learning | No strategy — human decides |
| End detection | Learned board evaluation | Exhaustive legal-move enumeration |
| Adaptability | Improves with play | Fixed rules, no learning |

The engine creates **correct, deterministic chess** from simple piece-rule composition. Legal move generation computes every response to a board configuration in the same way every time — no uncertainty, no neural inference.

This approach is:
- **Deterministic** (same board → same valid moves, always)
- **Fast** (no search tree, only single-ply filtering for check)
- **Debuggable** (every rejection traceable to `squareUnderAttack`)
- **Correct** (castling, en passant, and promotion all handled explicitly)
