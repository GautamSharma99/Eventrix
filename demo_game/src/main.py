import sys
import os
from pathlib import Path

import pygame as pg
from classes import *
from classes import Game_State as Gs
from agent import HeuristicAgent, RandomAgent

# Add game/ to sys.path so we can import streaming infrastructure
_GAME_DIR = str(Path(__file__).resolve().parents[2] / "game")
if _GAME_DIR not in sys.path:
    sys.path.insert(0, _GAME_DIR)

from frame_streamer import FrameStreamer
from ws_emitter import GameEmitter

# ---------------------------------------------------------------------------
# Agent configuration
# ---------------------------------------------------------------------------
# "human_vs_human"  — classic two-player (no agents)
# "human_vs_agent"  — you play white, agent plays black
# "agent_vs_agent"  — both sides are autonomous agents
AGENT_MODE = "agent_vs_agent"

# Frames to pause before an agent makes its move (so moves are visible)
AGENT_DELAY = 30


dimension = 8

width = height = 512

CIRCLE_RADIUS = 8

# Keeps the locations of white or black pieces on the board
black_location = set()

white_location = set()

pawn_promotion = False

# Keeps the promoted piece and it's position on the board
former_piece = None

former_index = None

rectangle = Rectangle(0, 0)

# Keeps track of the index of the last pawn that moved two squares
en_passant_piece = None


pg.init()

screen = pg.display.set_mode((width, height))

circle_group = pg.sprite.Group()

clock = pg.time.Clock()

move_sound = pg.mixer.Sound("../assets/sounds/move-self.mp3")

capture_sound = pg.mixer.Sound("../assets/sounds/capture.mp3")

castle_sound = pg.mixer.Sound("../assets/sounds/castle.mp3")

# ---------------------------------------------------------------------------
# Streaming infrastructure (game-002)
# ---------------------------------------------------------------------------
CHESS_GAME_ID = os.environ.get("BRIDGE_GAME_ID", "game-002")
frame_streamer = FrameStreamer(game_id=CHESS_GAME_ID)
emitter = GameEmitter(game_id=CHESS_GAME_ID)

square_group = pg.sprite.Group()

# Generates the 64 squares
for row in range(8):
    for column in range(8):
        if (row + column) % 2 == 0:
            square = Squares(column * 64, row * 64, "#F4A460")
        else:
            square = Squares(column * 64, row * 64, "#9D5A30")
        square_group.add(square)


def _piece_name(piece):
    """Return a human-readable name for a chess piece (for events)."""
    if piece == "--":
        return ""
    for cls, name in [(King, "king"), (Queen, "queen"), (Castle, "rook"),
                      (Bishop, "bishop"), (Knight, "knight"), (Pawn, "pawn")]:
        if isinstance(piece, cls):
            return name
    return "piece"


def update_atrs(gs):
    """
    Updates the black and white king's location attributes of the Game State object.
    Updates the black and white piece list attributes of the Game State object.

    :param gs: The Game State object.
    :type gs: Game_State
    :return: None
    """
    for i, row in enumerate(gs.board):
        for x, col in enumerate(row):
            if col != "--":
                if gs.board[i][x].color == "black":
                    if isinstance(gs.board[i][x], King):
                        gs.blackKing = (i, x)
                    gs.black_pieces.append(gs.board[i][x])
                else:
                    if isinstance(gs.board[i][x], King):
                        gs.whiteKing = (i, x)
                    gs.white_pieces.append(gs.board[i][x])


def draw_pieces(screen, gs):
    """
    Displays the images of the chess pieces onto the screen.

    Additionally, this method updates the white and black location sets with the current position of each piece.

    :param screen: The screen object to blit the images onto.
    :type screen: pg.Surface
    :param gs: The Game State object.
    :type gs: Game_State
    :return: None
    """
    for row in range(8):
        for column in range(8):
            if gs.board[row][column] != "--":
                if gs.board[row][column].color == "black":
                    pos = (column * 64, row * 64)
                    screen.blit(gs.board[row][column].image, pos)
                    black_location.add((pos[1] // 64, pos[0] // 64))

                elif gs.board[row][column].color == "white":
                    pos = (column * 64, row * 64)
                    screen.blit(gs.board[row][column].image, pos)
                    white_location.add((pos[1] // 64, pos[0] // 64))


def move_piece(Player_click, gs, turn):
    """
    Moves a chess piece on the board.

    This method takes a list of coordinates representing the starting and ending positions of a piece on the board, the Game State and the turn.
    It moves the piece from the start position to the end position, updating the board state accordingly.
    The function also tracks and updates the positions of the white and black kings if they are moved.
    This function also updates the black and white piece lists of the Game State object.
    This function also updates piece attributes en_passant and castling.

    :param Player_click: A list containing the starting and ending positions of the piece on the board.
    :type Player_click: list
    :param gs: The Game State object.
    :type gs: Game_State
    :param turn: The color of the current turn. Should be either "white" or "black".
    :type turn: str
    :return: True if the piece is moved, False otherwise.
    :rtype: bool
    """
    global pawn_promotion
    global rectangle
    global former_piece
    global former_index
    global en_passant_piece

    capture_a_piece = False
    castle = False
    piece_selected, desired_move = Player_click

    # Checks if the board has changed since the last pawn moved two squares
    if en_passant_piece:
        if gs.board_state != gs.board:
            gs.board[en_passant_piece[0]][en_passant_piece[1]].en_passant = False
            en_passant_piece = None

    # Removes the location of a captured piece from the white or black set
    if desired_move in white_location:
        white_location.remove(desired_move)
    elif desired_move in black_location:
        black_location.remove(desired_move)

    # Checks if it's a valid move (FIXME)
    if desired_move in gs.board[piece_selected[0]][piece_selected[1]].get_valid_moves(
        piece_selected, gs, turn
    ):
        # Checks if a Rook is moved and removes the castling ability
        if isinstance(gs.board[piece_selected[0]][piece_selected[1]], Castle):
            gs.board[piece_selected[0]][piece_selected[1]].castling = False

        # Checks if a King is moved, updates either the white or black king location and removes the castling ability
        if isinstance(gs.board[piece_selected[0]][piece_selected[1]], King):
            if gs.board[piece_selected[0]][piece_selected[1]].color == "white":
                gs.whiteKing = desired_move  # FIXME
            else:
                gs.blackKing = desired_move  # FIXME
            gs.board[piece_selected[0]][piece_selected[1]].castling = False

            # Checks for a castling move
            if abs(desired_move[1] - piece_selected[1]) == 2:
                # Makes the move for the king side castle
                if isinstance(gs.board[desired_move[0]][desired_move[1] + 1], Castle):
                    tmp = gs.board[desired_move[0]][desired_move[1] + 1]
                    gs.board[desired_move[0]][desired_move[1] + 1] = "--"
                    gs.board[desired_move[0]][desired_move[1] - 1] = tmp
                    prev_pos = (desired_move[0], desired_move[1] + 1)
                    new_pos = (desired_move[0], desired_move[1] - 1)

                # Makes the move for the Queen side castle
                elif isinstance(gs.board[desired_move[0]][desired_move[1] - 2], Castle):
                    tmp = gs.board[desired_move[0]][desired_move[1] - 2]
                    gs.board[desired_move[0]][desired_move[1] - 2] = "--"
                    gs.board[desired_move[0]][desired_move[1] + 1] = tmp
                    prev_pos = (desired_move[0], desired_move[1] + 1)
                    new_pos = (desired_move[0], desired_move[1] - 1)

                castle = True

                # Updates the location of the rook in the set (FIXME)
                if prev_pos in white_location:
                    white_location.remove(prev_pos)
                    white_location.add(new_pos)
                elif prev_pos in black_location:
                    black_location.remove(prev_pos)
                    white_location.add(new_pos)

        # Handles Pawn Special moves en_passant and promotion
        if isinstance(gs.board[piece_selected[0]][piece_selected[1]], Pawn):
            # Updates the current row and move count attributes of the Pawn
            gs.board[piece_selected[0]][piece_selected[1]].current_row = desired_move[0]
            gs.board[piece_selected[0]][piece_selected[1]].move_count += 1

            # Checks for En_passant move, updates the ability for the current pawn, removes the ability from the previous pawn with the ability
            if gs.board[piece_selected[0]][piece_selected[1]].move_count == 1:
                if (
                    abs(
                        gs.board[piece_selected[0]][piece_selected[1]].current_row
                        - gs.board[piece_selected[0]][piece_selected[1]].start_row
                    )
                    == 2
                ):
                    gs.board[piece_selected[0]][piece_selected[1]].en_passant = True
                    if en_passant_piece:
                        gs.board[en_passant_piece[0]][
                            en_passant_piece[1]
                        ].en_passant = False
                    en_passant_piece = desired_move
                    gs.board_state = [n[::] for n in gs.board]
                    cpy = gs.board_state[piece_selected[0]][piece_selected[1]]
                    gs.board_state[piece_selected[0]][piece_selected[1]] = "--"
                    gs.board_state[desired_move[0]][desired_move[1]] = cpy
            else:
                gs.board[piece_selected[0]][piece_selected[1]].en_passant = False

            # Checks if move is a pawn promotion, takes in the current piece and it's position on the board, also updates pawn_promotion and creates a drop down menu(Rectangle)
            if desired_move[0] == 7 or desired_move[0] == 0:
                pawn_promotion = True
                former_piece = gs.board[piece_selected[0]][piece_selected[1]]
                former_index = desired_move
                rectangle = Rectangle(desired_move[1], desired_move[0])

            dir = -gs.board[piece_selected[0]][piece_selected[1]].direction
            col = gs.board[piece_selected[0]][piece_selected[1]].color

            # Makes en_passant capture, updates the piece list's and location sets
            if isinstance(gs.board[desired_move[0] + dir][desired_move[1]], Pawn):
                if (
                    gs.board[desired_move[0] + dir][desired_move[1]].en_passant
                    and gs.board[desired_move[0] + dir][desired_move[1]].color != col
                ):
                    if (
                        gs.board[desired_move[0] + dir][desired_move[1]].color
                        == "white"
                    ):
                        gs.white_pieces.remove(
                            gs.board[desired_move[0] + dir][desired_move[1]]
                        )
                        white_location.remove((desired_move[0] + dir, desired_move[1]))
                    else:
                        gs.black_pieces.remove(
                            gs.board[desired_move[0] + dir][desired_move[1]]
                        )
                        black_location.remove((desired_move[0] + dir, desired_move[1]))
                    gs.board[desired_move[0] + dir][desired_move[1]] = "--"
                    capture_a_piece = True
                    en_passant_piece = None

        # Makes the move if there are no special cases
        tmp = gs.board[piece_selected[0]][piece_selected[1]]
        gs.board[piece_selected[0]][piece_selected[1]] = "--"
        captured = gs.board[desired_move[0]][desired_move[1]]
        gs.board[desired_move[0]][desired_move[1]] = tmp

        # Removes the captured piece from either the black or white list, if there is a captured piece.
        if captured != "--":
            capture_a_piece = True
            if captured.color == "white":
                gs.white_pieces.remove(captured)
            elif captured.color == "black":
                gs.black_pieces.remove(captured)

        # Plays the corresponding sound
        if capture_a_piece:
            capture_sound.play()
        elif castle:
            castle_sound.play()
        else:
            move_sound.play()
        circle_group.empty()

        return True
    return False


def checkMate(gamestate, turn):
    """
    Checks if the current board configuration for a given turn is a checkmate.

    The algorithm used in this function involves the following steps:
    1. Checks if the current turn's king is in check.
    2. If the king is in check, checks if any piece of the same color has legal moves that can remove the check.
    3. If there is at least one piece with legal moves, then it is not a checkmate.

    :param gamestate: The Game State object.
    :type gamestate: Game_State
    :param turn: The color of the current turn. Should be either "white" or "black".
    :type turn: str
    :return: True if it's a checkmate, False otherwise.
    """
    if gamestate.if_Check(turn):
        if turn == "white":
            for pieces in gamestate.white_pieces:
                if pieces.get_valid_moves(gamestate.get_pos(pieces), gamestate, turn):
                    return False
        elif turn == "black":
            for pieces in gamestate.black_pieces:
                if pieces.get_valid_moves(gamestate.get_pos(pieces), gamestate, turn):
                    return False
        return True
    return False


def staleMate(gamestate, turn):
    """
    Checks if the current board configuration for a given turn is a stalemate.

    Stalemate occurs when the player whose turn it is to move has no legal moves, but their king is not in check.
    This means the game ends in a draw.

    :param gamestate: The Game State object.
    :type gamestate: Game_State
    :param turn: The color of the current turn. Should be either "white" or "black".
    :type turn: str
    :return: True if it's a checkmate, False otherwise.
    """
    if turn == "white":
        for pieces in gamestate.white_pieces:
            if pieces.get_valid_moves(gamestate.get_pos(pieces), gamestate, turn):
                return False
    elif turn == "black":
        for pieces in gamestate.black_pieces:
            if pieces.get_valid_moves(gamestate.get_pos(pieces), gamestate, turn):
                return False
    return True


def main():
    global pawn_promotion
    global former_piece
    global en_passant_piece

    flag = True  # Main game loop varible
    active = False
    check_mate = False
    stale_mate = False

    # Handles mouse click
    Selected = ()
    Player_click = []

    # --- Agent setup ---
    white_agent = HeuristicAgent("white")
    black_agent = HeuristicAgent("black")
    agent_delay_counter = 0

    def is_agent_turn(turn):
        """Return True if the current turn should be handled by an agent."""
        if AGENT_MODE == "agent_vs_agent":
            return True
        if AGENT_MODE == "human_vs_agent" and turn == "black":
            return True
        return False

    def get_agent(turn):
        return white_agent if turn == "white" else black_agent

    while flag:
        for event in pg.event.get():
            if event.type == pg.QUIT:
                frame_streamer.close()
                emitter.close()
                flag = False

            if event.type == pg.KEYDOWN:
                # Starts a new game if the Spacebar is pressed
                if event.key == pg.K_SPACE:
                    if not active:
                        active = True
                    gs = Gs()
                    update_atrs(gs)
                    turn = "white"
                    stale_mate = False
                    check_mate = False
                    en_passant_piece = None
                    white_location.clear()
                    black_location.clear()
                    # Emit GAME_START event to bridge
                    emitter.emit("GAME_START", players=["white", "black"],
                                 mode=AGENT_MODE, game_type="chess")

            # Checks for mouse click
            if event.type == pg.MOUSEBUTTONDOWN:
                y_pos, x_pos = pg.mouse.get_pos()  # FIXME

                # Deselect logic
                if Selected == (x_pos // 64, y_pos // 64):
                    Selected = ()  # Stores the current location of a click on the board
                    Player_click = (
                        []
                    )  # Stores the start and end position used in the move function, should never exceed 2 items
                    circle_group.empty()
                else:
                    # Checks if the selected piece is valid, not an empty square or opponent's piece (FIXME)
                    if len(Player_click) == 0:
                        if (
                            turn == "white"
                            and (x_pos // 64, y_pos // 64) in white_location
                        ):
                            Selected = (x_pos // 64, y_pos // 64)
                            Player_click.append(Selected)
                        elif (
                            turn == "black"
                            and (x_pos // 64, y_pos // 64) in black_location
                        ):
                            Selected = (x_pos // 64, y_pos // 64)
                            Player_click.append(Selected)
                    else:
                        # Checks if a piece of same color is selected, and updates the start location
                        if (
                            turn == "white"
                            and (x_pos // 64, y_pos // 64) in white_location
                        ):
                            circle_group.empty()
                            Player_click.clear()
                            Selected = (x_pos // 64, y_pos // 64)
                            Player_click.append(Selected)

                        elif (
                            turn == "black"
                            and (x_pos // 64, y_pos // 64) in black_location
                        ):
                            circle_group.empty()
                            Player_click.clear()
                            Selected = (x_pos // 64, y_pos // 64)
                            Player_click.append(Selected)
                        # Checks if the square selected does not contain a friendly piece
                        else:
                            Selected = (x_pos // 64, y_pos // 64)
                            Player_click.append(Selected)

                # Highlights the valid moves squares of the selected piece with circles (FIXME)
                if len(Player_click) == 1:
                    for n in gs.board[x_pos // 64][y_pos // 64].get_valid_moves(
                        (x_pos // 64, y_pos // 64), gs, turn
                    ):
                        circle_sprite = Circle(
                            (n[1] * 64) + 32, (n[0] * 64) + 32, CIRCLE_RADIUS
                        )
                        circle_group.add(circle_sprite)

                # Checks if a Start and End position is selected
                if len(Player_click) == 2:
                    # Makes the move, resets Player clicks, updates the location set and the turn
                    if turn == "white" and Player_click[0] in white_location:
                        if move_piece(Player_click, gs, turn):
                            white_location.remove(Player_click[0])
                            white_location.add(Player_click[1])
                            piece_at = gs.board[Player_click[1][0]][Player_click[1][1]]
                            emitter.emit("MOVE", player="white",
                                         start=list(Player_click[0]),
                                         end=list(Player_click[1]),
                                         piece=_piece_name(piece_at))
                            turn = "black"

                    elif turn == "black" and Player_click[0] in black_location:
                        if move_piece(Player_click, gs, turn):
                            black_location.remove(Player_click[0])
                            black_location.add(Player_click[1])
                            piece_at = gs.board[Player_click[1][0]][Player_click[1][1]]
                            emitter.emit("MOVE", player="black",
                                         start=list(Player_click[0]),
                                         end=list(Player_click[1]),
                                         piece=_piece_name(piece_at))
                            turn = "white"

                    Selected = ()
                    Player_click = []

        # This loops handles while playing the game
        if active:
            # Displays the initial board
            square_group.draw(screen)
            draw_pieces(screen, gs)

            # --- Emit CHECK event ---
            if gs.if_Check(turn):
                emitter.emit("CHECK", king=turn)

            # --- AGENT TURN ---
            if is_agent_turn(turn) and not pawn_promotion:
                agent_delay_counter += 1
                if agent_delay_counter >= AGENT_DELAY:
                    agent_delay_counter = 0
                    agent = get_agent(turn)
                    move = agent.get_move(gs, turn)
                    if move is not None:
                        start, end = move
                        agent_click = [start, end]
                        if turn == "white" and start in white_location:
                            if move_piece(agent_click, gs, turn):
                                white_location.discard(start)
                                white_location.add(end)
                                piece_at = gs.board[end[0]][end[1]]
                                emitter.emit("MOVE", player="white",
                                             start=list(start), end=list(end),
                                             piece=_piece_name(piece_at))
                                # Auto-promote pawn to Queen for agents
                                if pawn_promotion:
                                    promo_color = former_piece.color
                                    if promo_color == "white":
                                        new_piece = Queen("../assets/images/wQ.png", "white")
                                        gs.white_pieces.remove(gs.board[former_index[0]][former_index[1]])
                                        gs.white_pieces.append(new_piece)
                                    else:
                                        new_piece = Queen("../assets/images/bQ.png", "black")
                                        gs.black_pieces.remove(gs.board[former_index[0]][former_index[1]])
                                        gs.black_pieces.append(new_piece)
                                    gs.board[former_index[0]][former_index[1]] = new_piece
                                    pawn_promotion = False
                                turn = "black"
                        elif turn == "black" and start in black_location:
                            if move_piece(agent_click, gs, turn):
                                black_location.discard(start)
                                black_location.add(end)
                                piece_at = gs.board[end[0]][end[1]]
                                emitter.emit("MOVE", player="black",
                                             start=list(start), end=list(end),
                                             piece=_piece_name(piece_at))
                                # Auto-promote pawn to Queen for agents
                                if pawn_promotion:
                                    promo_color = former_piece.color
                                    if promo_color == "white":
                                        new_piece = Queen("../assets/images/wQ.png", "white")
                                        gs.white_pieces.remove(gs.board[former_index[0]][former_index[1]])
                                        gs.white_pieces.append(new_piece)
                                    else:
                                        new_piece = Queen("../assets/images/bQ.png", "black")
                                        gs.black_pieces.remove(gs.board[former_index[0]][former_index[1]])
                                        gs.black_pieces.append(new_piece)
                                    gs.board[former_index[0]][former_index[1]] = new_piece
                                    pawn_promotion = False
                                turn = "white"
                    else:
                        # Agent has no legal moves — checkmate or stalemate detected below
                        pass

            # Handles pawn promotion for HUMAN players (dropdown menu)
            if pawn_promotion and not is_agent_turn(former_piece.color if former_piece else turn):
                pg.draw.rect(screen, "#ffffff", rectangle)
                rectangle.display_images(screen)
                initial = former_piece
                turn = former_piece.color
                former_piece = rectangle.assign_piece(former_piece)

                if initial != former_piece:
                    if former_piece.color == "white":
                        gs.white_pieces.remove(
                            gs.board[former_index[0]][former_index[1]]
                        )
                        gs.white_pieces.append(former_piece)
                        turn = "black"
                    elif former_piece.color == "black":
                        gs.black_pieces.remove(
                            gs.board[former_index[0]][former_index[1]]
                        )
                        gs.black_pieces.append(former_piece)
                        turn = "white"
                    gs.board[former_index[0]][former_index[1]] = former_piece
                    pawn_promotion = False

            # Highlights the square the king is on in red if check
            if gs.if_Check(turn):
                if turn == "white":
                    gs.board[gs.whiteKing[0]][gs.whiteKing[1]].check = True
                    for square in square_group.sprites():
                        if (
                            square.rect.y // 64 == gs.whiteKing[0]
                            and square.rect.x // 64 == gs.whiteKing[1]
                        ):
                            square.image.fill("red")
                elif turn == "black":
                    gs.board[gs.blackKing[0]][gs.blackKing[1]].check = True
                    for square in square_group.sprites():
                        if (
                            square.rect.y // 64 == gs.blackKing[0]
                            and square.rect.x // 64 == gs.blackKing[1]
                        ):
                            square.image.fill("red")
            else:
                for square in square_group.sprites():
                    square.image.fill(square.original)

            # Checks for Checkmate
            if checkMate(gs, turn):
                check_mate = True
                active = False
                winner = "black" if turn == "white" else "white"
                emitter.emit("CHECKMATE", loser=turn, winner=winner)
                emitter.emit("GAME_END", winner=winner, result="checkmate")

            # Checks for Stalemate
            elif staleMate(gs, turn):
                stale_mate = True
                active = False
                emitter.emit("STALEMATE", turn=turn)
                emitter.emit("GAME_END", winner="draw", result="stalemate")

            # updates the highlighting circle
            circle_group.update()
            circle_group.draw(screen)

        # Handles while the game is not being played
        else:
            font = pg.font.SysFont("Helvetica", 25)
            text2_rect = None
            # Displays message if there is checkmate
            if check_mate:
                text1 = font.render(f"{turn} lose".title(), True, "red")
                text1_rect = text1.get_rect(center=(256, 240))
                text2 = font.render(f"Hit Space to Restart Game", True, "red")
                text2_rect = text2.get_rect(center=(256, 280))

            # Displays message if there is stalemate
            elif stale_mate:
                text1 = font.render(f"Stalemate".capitalize(), True, "red")
                text1_rect = text1.get_rect(center=(256, 240))
                text2 = font.render(f"Hit Space to Restart Game", True, "red")
                text2_rect = text2.get_rect(center=(256, 280))

            # Display initial message to start the game
            else:
                text1 = font.render(f"Hit Space to Start", True, "red")
                text1_rect = text1.get_rect(center=(256, 240))

            screen.fill("white")
            screen.blit(text1, text1_rect)
            if text2_rect:
                screen.blit(text2, text2_rect)

        # Handles updating the screen and frames
        pg.display.update()
        frame_streamer.submit(screen)  # Stream frame to bridge
        clock.tick(60)


if __name__ == "__main__":
    main()
