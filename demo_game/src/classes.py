import pygame as pg


class Circle(pg.sprite.Sprite):
    """ "
    Responsible for highlighting valid moves.
    """

    def __init__(self, x, y, radius):
        """
        Initialize an instance of the class.

        :param x: the x position of the cirle on the screen.
        :type x: int
        :param y: the y position of the cirle on the screen.
        :type y: int
        :param radius: the raduis of the circle.
        :type radius: int
        """
        super().__init__()
        self.radius = radius
        self.color = "#D3D3D3"
        self.image = pg.Surface((self.radius * 2, self.radius * 2), pg.SRCALPHA)
        self.rect = self.image.get_rect(center=(x, y))

    def update(self):
        """
        Draws the cirle on the GUI board.
        :return: None
        """
        pg.draw.circle(self.image, self.color, (self.radius, self.radius), self.radius)


class Game_State:
    """
    Represents the configuration of the game
    """

    def __init__(self):
        """
        Initialize a new game board and set up the initial game state.

        This method creates the chessboard by initializing a nested list, representing the positions
        of different chess pieces. It assigns specific pieces to each position on the board to set up
        the initial game state.

        It also initializes empty lists to store white and black pieces separately, as well as variables
        to track the positions of the white and black kings.

        Additionally, it has an attribute board_state that keeps track of the board configuration after each en passant move.

        :return: None
        """
        self.board = [
            [
                Castle("../assets/images/bR.png", "black"),
                Knight("../assets/images/bN.png", "black"),
                Bishop("../assets/images/bB.png", "black"),
                Queen("../assets/images/bQ.png", "black"),
                King("../assets/images/bK.png", "black"),
                Bishop("../assets/images/bB.png", "black"),
                Knight("../assets/images/bN.png", "black"),
                Castle("../assets/images/bR.png", "black"),
            ],
            [
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
                Pawn("../assets/images/bp.png", "black"),
            ],
            ["--" for _ in range(8)],
            ["--" for _ in range(8)],
            ["--" for _ in range(8)],
            ["--" for _ in range(8)],
            [
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
                Pawn("../assets/images/wp.png", "white"),
            ],
            [
                Castle("../assets/images/wR.png", "white"),
                Knight("../assets/images/wN.png", "white"),
                Bishop("../assets/images/wB.png", "white"),
                Queen("../assets/images/wQ.png", "white"),
                King("../assets/images/wK.png", "white"),
                Bishop("../assets/images/wB.png", "white"),
                Knight("../assets/images/wN.png", "white"),
                Castle("../assets/images/wR.png", "white"),
            ],
        ]

        self.white_pieces = []
        self.black_pieces = []

        self.whiteKing = None
        self.blackKing = None

        self.board_state = None

        # Updates the start_pos variable of the Castle object on the board
        for i, row in enumerate(self.board):
            for j, col in enumerate(row):
                if isinstance(col, Castle):
                    col.start_pos = (i, j)

    def get_pos(self, chesspiece):
        """
        Retrieves the position of the chesspiece on the board.

        This method iterates over the board and checks for the presence of the given chesspiece.
        Once found, it returns a tuple containing the x and y coordinates of the chesspiece on the board.

        :param chesspiece: The chesspiece object for which the position is to be retrieved.
        :type chesspiece: Piece
        :return: A tuple representing the x and y coordinates of the chesspiece on the board.
        :rtype: tuple
        """
        for i in range(len(self.board)):
            for j in range(len(self.board)):
                if self.board[i][j] == chesspiece:
                    return (i, j)

    def if_Check(self, turn):
        """
        Checks if the turn's (color) king is in check.

        This method iterates over the opponent's piece list and for each opponent's piece,
        generates its moves. It then checks if the turn's king position is in the generated list.

        :param turn: The color of the current turn. Should be either "white" or "black".
        :type turn: str
        :return: True if the turn's king is in check, False otherwise.
        :rtype: bool
        """
        if turn == "white":
            for pieces in self.black_pieces:
                if self.whiteKing in pieces.get_moves(self.get_pos(pieces), self.board):
                    return True
        elif turn == "black":
            for pieces in self.white_pieces:
                if self.blackKing in pieces.get_moves(self.get_pos(pieces), self.board):
                    return True
        return False

    def squareUnderAttack(self, start, turn):
        """
        Determines the valid moves for a given piece on the board that do not result in the king being in check.

        This method takes the position of a piece on the chessboard and the current turn's color. It generates the
        possible moves for the piece and checks if making each move would result in the king being in check. Moves
        that leave the king in check are excluded, and only valid moves are returned.

        The algorithm used in this method involves the following steps:
        1. Retrieve the piece at the given starting position.
        2. If it is the current turn's piece, generate its possible moves.
        3. For each possible move, temporarily make the move on the board.
        4. Iterate over the opponent's pieces and generate their possible moves.
        5. Check if the position of the current turn's king is in the generated moves of each opponent's piece.
        6. If the king is found in any of the opponent's moves, consider the move as invalid.
        7. Undo the temporary move and continue to the next possible move.
        8. If a move does not expose the king to a check, consider it as a valid move and add it to the list.

        :param start: The current position of the piece on the chessboard.
        :type start: tuple
        :param turn: The color of the current turn. Should be either "white" or "black".
        :type turn: str
        :return: A list of valid moves for the piece that do not result in the king being in check.
        :rtype: list
        """
        valid_moves = []
        piece = self.board[start[0]][start[1]]
        if turn == "white":
            if piece in self.white_pieces:
                pseudo_moves = piece.get_moves(start, self.board)
                for moves in pseudo_moves:
                    captured = self.pseudo_move([start, moves])
                    is_valid = True
                    for pieces in self.black_pieces:
                        if self.whiteKing in pieces.get_moves(
                            self.get_pos(pieces), self.board
                        ):
                            is_valid = False
                    self.undo_move([start, moves], captured)
                    if is_valid:
                        valid_moves.append(moves)

        elif turn == "black":
            if piece in self.black_pieces:
                pseudo_moves = piece.get_moves(start, self.board)
                for moves in pseudo_moves:
                    captured = self.pseudo_move([start, moves])
                    is_valid = True
                    for pieces in self.white_pieces:
                        if self.blackKing in pieces.get_moves(
                            self.get_pos(pieces), self.board
                        ):
                            is_valid = False
                    self.undo_move([start, moves], captured)
                    if is_valid:
                        valid_moves.append(moves)
        return valid_moves

    def pseudo_move(self, coords):
        """
        Temporarily moves a chess piece on the board.

        This method takes a list of coordinates representing the starting and ending positions of a piece on the board.
        It temporarily moves the piece from the start position to the end position, updating the board state accordingly.
        The method also tracks and updates the positions of the white and black kings if they are moved.

        :param coords: A list containing the starting and ending positions of the piece on the board.
        :type coords: list
        :return: The captured piece on the board, if any.
        :rtype: str or Piece
        """
        start, end = coords
        tmp = self.board[start[0]][start[1]]
        self.board[start[0]][start[1]] = "--"
        captured = self.board[end[0]][end[1]]
        self.board[end[0]][end[1]] = tmp

        if tmp.color == "white" and isinstance(tmp, King):
            self.whiteKing = end
        elif tmp.color == "black" and isinstance(tmp, King):
            self.blackKing = end
        if captured in self.white_pieces:
            self.white_pieces.remove(captured)
        elif captured in self.black_pieces:
            self.black_pieces.remove(captured)

        return captured

    def undo_move(self, coords, captured_piece):
        """
        Undoes a temporary move made on the board.

        This method takes a list of coordinates representing the starting and ending positions of a piece on the board
        for a temporary move. It reverts the board state to the original configuration before the move was made,
        restoring the piece to its starting position and the captured piece (if any) to its original position.
        The method also tracks and updates the positions of the white and black kings if they were involved in the move.

        :param coords: A list containing the starting and ending positions of the piece on the board.
        :type coords: list
        :param captured_piece: The captured piece during the temporary move.
        :type captured_piece: str or Piece
        :return: None
        """
        start, end = coords
        piece = self.board[end[0]][end[1]]
        self.board[start[0]][start[1]] = piece
        self.board[end[0]][end[1]] = captured_piece

        if piece.color == "white" and isinstance(piece, King):
            self.whiteKing = start
        elif piece.color == "black" and isinstance(piece, King):
            self.blackKing = start
        if captured_piece != "--":
            if captured_piece.color == "white":
                self.white_pieces.append(captured_piece)
            elif captured_piece.color == "black":
                self.black_pieces.append(captured_piece)


class Piece:
    """
    The parent class for all chess pieces
    """

    def __init__(self, image : str, color : str):
        """
        Initialize a chess piece with its image and color.

        :param image: The image file of the chess piece.
        :type image: str
        :param color: The color of the chess piece.
        :type color: str
        :return: None
        """
        self.image = pg.image.load(image)
        self.color = color

    def get_moves(self, pos : tuple, board):
        """
        Get the possible moves for the chess piece.

        This is a default implementation that is overwritten by subclasses.
        Returns an empty list as a placeholder.

        :param pos: The current position of the piece on the chessboard.
        :type pos: tuple
        :param board: The chess board.
        :type board: List
        :return: An empty list.
        :rtype: List
        """
        return []

    def get_valid_moves(self, pos, gs, turn):
        """
        Get the valid moves for the chess piece,taking into consideration
        the current game state and the possibility of putting the player's own king in check.

         This is a default implementation that is overwritten by subclasses.
         Returns an empty list as a placeholder.

         :param pos: The current position of the piece on the chessboard.
         :type pos: tuple
         :param gs: The Game State object.
         :type gs: Game_State
         :param turn: The color of the current turn. Should be either "white" or "black".
         :type turn: str
         :return: An empty list.
         :rtype: List
        """
        return gs.squareUnderAttack(pos, turn)


class King(Piece):
    """
    Represents the King.
    """

    def __init__(self, image, color):
        """
        Initialize the King.

        This method initializes the King by calling the superclass's (Piece) initializer with the image file and color of the piece.
        It also sets the initial position of the King on the chessboard based on its color (row 7 for white, row 0 for black).
        The castling attribute is set to True to indicate that the King is initially eligible for castling.
        The check attribute is set to False to indicate that the King is not currently in check.

        :param image: The image file of the King chess piece.
        :type image: str
        :param color: The color of the King chess piece.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)
        self.start_pos = (7, 4) if self.color == "white" else (0, 4)
        self.castling = True
        self.check = False

    def get_moves(self, pos, board):
        """
        Get the valid moves for the King chess piece.

        This method calculates and returns the possible moves for the King chess piece based on its current position and the state of the chessboard.
        The method considers all the 8 possible directions the King can move: up, down, left, right, and the diagonal directions.
        It checks each direction to see if the move is within the bounds of the chessboard and if the destination square is either empty or occupied by an opponent's piece.
        The method also checks for castling moves if the King is eligible for castling.

        :param pos: The current position of the King on the chessboard.
        :type pos: tuple
        :param board: The chessboard state.
        :type board: List
        :return: A list of valid moves for the King.
        :rtype: List
        """
        x, y = pos
        directions = [
            (1, 0),
            (-1, 0),
            (0, 1),
            (0, -1),
            (1, 1),
            (-1, 1),
            (1, -1),
            (-1, -1),
        ]
        moves = []

        for dx, dy in directions:
            x_temp, y_temp = x + dx, y + dy
            if 0 <= x_temp < len(board) and 0 <= y_temp < len(board[x_temp]):
                if board[x_temp][y_temp] == "--":
                    moves.append((x_temp, y_temp))
                elif board[x_temp][y_temp].color != self.color:
                    moves.append((x_temp, y_temp))

        # Castling
        if not self.check and (pos == self.start_pos):
            if self.castling:
                if isinstance(board[x][y + 3], Castle):
                    if board[x][y + 3].castling:
                        if board[x][y + 1] == "--" and board[x][y + 2] == "--":
                            moves.append((x, y + 2))

                if isinstance(board[x][y - 4], Castle):
                    if board[x][y - 4].castling:
                        if (
                            board[x][y - 1] == "--"
                            and board[x][y - 2] == "--"
                            and board[x][y - 3] == "--"
                        ):
                            moves.append((x, y - 2))

        return moves

    def get_valid_moves(self, pos, gs, turn):
        """
        Generates the valid moves for the King piece.

        In addition to the default implementation, it checks if a castling move is detected,
        it checks if the intermediate square is under attack and if the square before the castle square is in check.
        If either of these conditions is met, the castling move is not added to the list of valid moves.
        The final list of valid moves is returned.

        :param pos: The current position of the King on the chessboard.
        :type pos: tuple
        :param gs: The Game State object.
        :type gs: Game_State
        :param turn: The color of the current turn. Should be either "white" or "black".
        :type turn: str
        :return: An empty list.
        :rtype: List
        """
        valid_moves = sorted(gs.squareUnderAttack(pos, turn))
        l, r = 0, len(valid_moves)
        while l < r:
            if valid_moves[l][1] - self.start_pos[1] == 2 and self.castling:
                if (valid_moves[l][0], valid_moves[l][1] - 1) not in valid_moves:
                    valid_moves.remove(valid_moves[l])
                    r -= 1
            elif valid_moves[l][1] - self.start_pos[1] == -2 and self.castling:
                if (valid_moves[l][0], valid_moves[l][1] + 1) not in valid_moves:
                    valid_moves.remove(valid_moves[l])
                    r -= 1
            l += 1

        return valid_moves


class Queen(Piece):
    """
    Represents the Queen.
    """

    def __init__(self, image, color):
        """
        Initialize the Queen.

        This method initializes the Queen by calling the superclass's
        (Piece) initializer with the image file and color of the piece.

        :param image: The image file of the Queen chess piece.
        :type image: str
        :param color: The color of the Queen chess piece.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)

    def get_moves(self, pos, board):
        """
        Get the possible moves for the Queen.

        This method calculates the possible moves for the Queen based on its current position on the chessboard and the state of the board.
        It iterates over the predefined directions (horizontal, vertical, and diagonal) to explore possible moves in each direction.
        For each direction, it continues moving in that direction until it encounters the edge of the board or another piece.
        If an empty square is encountered, it is added to the list of moves.
        If an opponent's piece is encountered, it is also added to the list of moves, but the iteration in that direction is stopped.
        If a piece of the same color is encountered, the iteration in that direction is stopped.

        :param pos: The current position of the Queen on the chessboard.
        :type pos: tuple
        :param board: The chess board.
        :type board: List
        :return: A list of possible moves for the Queen.
        :rtype: List
        """
        x, y = pos
        directions = [
            (1, 0),
            (-1, 0),
            (0, 1),
            (0, -1),
            (1, 1),
            (-1, 1),
            (1, -1),
            (-1, -1),
        ]
        moves = []

        for dx, dy in directions:
            x_temp, y_temp = x + dx, y + dy
            while 0 <= x_temp < len(board) and 0 <= y_temp < len(board[x_temp]):
                if board[x_temp][y_temp] != "--":
                    if board[x_temp][y_temp].color == self.color:
                        break
                    else:
                        moves.append((x_temp, y_temp))
                        break
                moves.append((x_temp, y_temp))
                x_temp += dx
                y_temp += dy

        return moves


class Castle(Piece):
    """
    Represents the Rook
    """

    def __init__(self, image, color):
        """
        Initialize the Rook piece.

        This method initializes the Rook by calling the superclass's
        (Piece) initializer with the image file and color of the piece.
        It has initial position attribute, start_pos, that is set during the initialization of the Game_State
        The castling attribute is set to True to indicate that the Rook is initially eligible for castling.

        :param image: The image file of the Rook.
        :type image: str
        :param color: The color of the Rook.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)
        Piece.__init__(self, image, color)
        self.start_pos = None
        self.castling = True

    def get_moves(self, pos, board):
        """
        Get the possible moves for the Rook.

        This method calculates the possible moves for the Rook based on its current position on the chessboard and the state of the board.
        It iterates over the predefined directions (horizontal and vertical) to explore possible moves in each direction.
        For each direction, it continues moving in that direction until it encounters the edge of the board or another piece.
        If an empty square is encountered, it is added to the list of moves.
        If an opponent's piece is encountered, it is also added to the list of moves, but the iteration in that direction is stopped.
        If a piece of the same color is encountered, the iteration in that direction is stopped.

        :param pos: The current position of the Rook on the chessboard.
        :type pos: tuple
        :param board: The chess board.
        :type board: List
        :return: A list of possible moves for the Rook.
        :rtype: List
        """
        x, y = pos
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        moves = []

        for dx, dy in directions:
            x_temp, y_temp = x + dx, y + dy
            while 0 <= x_temp < len(board) and 0 <= y_temp < len(board[x_temp]):
                if board[x_temp][y_temp] != "--":
                    if board[x_temp][y_temp].color == self.color:
                        break
                    else:
                        moves.append((x_temp, y_temp))
                        break
                moves.append((x_temp, y_temp))
                x_temp += dx
                y_temp += dy

        return moves


class Bishop(Piece):
    """
    Represents the Bishop.
    """

    def __init__(self, image, color):
        """
        Initialize the Bishop.

        This method initializes the Bishop by calling the superclass's
        (Piece) initializer with the image file and color of the piece.

        :param image: The image file of the Bishop.
        :type image: str
        :param color: The color of the Bishop.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)

    def get_moves(self, pos, board):
        """ "
        Get the possible moves for the Bishop.

        This method calculates the possible moves for the Bishop based on its current position on the chessboard and the state of the board.
        It iterates over the predefined directions (diagonal) to explore possible moves in each direction.
        For each direction, it continues moving in that direction until it encounters the edge of the board or another piece.
        If an empty square is encountered, it is added to the list of moves.
        If an opponent's piece is encountered, it is also added to the list of moves, but the iteration in that direction is stopped.
        If a piece of the same color is encountered, the iteration in that direction is stopped.

        :param pos: The current position of the Bishop on the chessboard.
        :type pos: tuple
        :param board: The chess board.
        :type board: List
        :return: A list of possible moves for the Bishop.
        :rtype: List
        """
        x, y = pos
        directions = [(1, 1), (-1, 1), (1, -1), (-1, -1)]
        moves = []

        for dx, dy in directions:
            x_temp, y_temp = x + dx, y + dy
            while 0 <= x_temp < len(board) and 0 <= y_temp < len(board[x_temp]):
                if board[x_temp][y_temp] != "--":
                    if board[x_temp][y_temp].color == self.color:
                        break
                    else:
                        moves.append((x_temp, y_temp))
                        break
                moves.append((x_temp, y_temp))
                x_temp += dx
                y_temp += dy

        return moves


class Knight(Piece):
    """
    Represents the Knight.
    """

    def __init__(self, image, color):
        """
        Initialize the Knight.

        This method initializes the Knight by calling the superclass's
        (Piece) initializer with the image file and color of the piece.

        :param image: The image file of the Knight.
        :type image: str
        :param color: The color of the Knight.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)

    def get_moves(self, pos, board):
        """
        Get the possible moves for the Knight chess piece.

        This method calculates the possible moves for the Knight based on its current position on the chessboard and the state of the board.
        The Knight has a unique movement pattern, which involves moving in an L-shape: two squares in one direction (vertical or horizontal) and one square in a perpendicular direction.
        The method generates all potential moves for the Knight and checks if each move is within the boundaries of the chessboard.
        If the target square is empty, it is considered a valid move.
        If the target square contains an opponent's piece, it is also considered a valid move.
        The method returns a list of all valid moves for the Knight.

        :param pos: The current position of the Knight on the chessboard.
        :type pos: tuple
        :param board: The chess board.
        :type board: List
        :return: A list of possible moves for the Knight.
        :rtype: List
        """
        moves = []
        x, y = pos

        direction = 1 if self.color == "white" else -1

        potential_moves = [
            (x + 2 * direction, y + 1),
            (x + 2 * direction, y - 1),
            (x + 1 * direction, y + 2),
            (x + 1 * direction, y - 2),
            (x - 1 * direction, y + 2),
            (x - 1 * direction, y - 2),
            (x - 2 * direction, y + 1),
            (x - 2 * direction, y - 1),
        ]

        for move in potential_moves:
            if 0 <= move[0] <= 7 and 0 <= move[1] <= 7:
                if board[move[0]][move[1]] == "--":
                    moves.append(move)
                elif board[move[0]][move[1]].color != self.color:
                    moves.append(move)

        return moves


class Pawn(Piece):
    """
    Represents a Pawn
    """

    def __init__(self, image, color):
        """
        Initialize the Pawn chess piece.

        This method initializes the Pawn by calling the superclass's (Piece) initializer with the image file and color of the piece.
        It also sets the direction and start_row of the Pawn based on its color.
        The direction determines the pawn's movement direction on the chessboard.
        The start_row represents the row where the pawn starts on the chessboard.
        The move_count keeps track of the number of moves made by the pawn.
        The current_row stores the current row position of the pawn.
        The en_passant attribute is initially set to False to indicate that the pawn is not eligible for en passant capture.

        :param image: The image file of the Pawn.
        :type image: str
        :param color: The color of the Pawn.
        :type color: str
        :return: None
        """
        Piece.__init__(self, image, color)
        if self.color == "white":
            self.direction = -1
            self.start_row = 6
        else:
            self.direction = 1
            self.start_row = 1
        self.move_count = 0
        self.current_row = self.start_row
        self.en_passant = False

    def get_moves(self, pos, board):
        """
        Get the possible moves for the Pawn.

        This method calculates the possible moves for the Pawn chess piece based on its current position on the chessboard.
        The moves are determined by the pawn's movement rules, including capturing, advancing, and special moves such as en passant.

        :param pos: The current position of the Pawn on the chessboard.
        :type pos: tuple
        :param board: The chessboard.
        :type board: List
        :return: A list of possible moves for the Pawn.
        :rtype: List
        """
        moves = []
        x, y = pos

        # Check for forward moves
        if 0 <= x + self.direction <= 7 and board[x + self.direction][y] == "--":
            moves.append((x + self.direction, y))
            if x == self.start_row and board[x + 2 * self.direction][y] == "--":
                moves.append((x + 2 * self.direction, y))

        # Check for capturing moves
        if 0 <= x + self.direction <= 7:
            if (
                0 < y <= 7
                and board[x + self.direction][y - 1] != "--"
                and board[x + self.direction][y - 1].color != self.color
            ):
                moves.append((x + self.direction, y - 1))
            if (
                0 <= y < 7
                and board[x + self.direction][y + 1] != "--"
                and board[x + self.direction][y + 1].color != self.color
            ):
                moves.append((x + self.direction, y + 1))

        # Check for en passant moves
        if 0 < y - 1:
            if isinstance(board[x][y - 1], Pawn):
                if board[x][y - 1].en_passant:
                    moves.append((x + self.direction, y - 1))

        if y + 1 < 7:
            if isinstance(board[x][y + 1], Pawn):
                if board[x][y + 1].en_passant:
                    moves.append((x + self.direction, y + 1))

        return moves


class Squares(pg.sprite.Sprite):
    """
    Represents each square on the GUI board.
    """

    def __init__(self, x, y, fill):
        """
        Initialize a square on the GUI board.

        This method initializes a square by setting its position and fill color.

        :param x: The x-coordinate of the square on the GUI board.
        :type x: int
        :param y: The y-coordinate of the square on the GUI board.
        :type y: int
        :param fill: The fill color of the square.
        :type fill: tuple or str
        :return: None
        """
        super().__init__()
        self.image = pg.Surface((64, 64))
        self.image.fill(fill)
        self.rect = self.image.get_rect()
        self.rect.topleft = [x, y]
        self.original = fill


class Rectangle(pg.sprite.Sprite):
    """
    Represents a rectangle on the GUI board for pawn promotion.
    """

    def __init__(self, x, y):
        """
        Initialize a rectangle on the GUI board for pawn promotion.

        This method initializes a rectangle by setting its dimensions, position, and promotion pieces based on the given coordinates.

        :param x: The x-coordinate of the rectangle on the GUI board.
        :type x: int
        :param y: The y-coordinate of the rectangle on the GUI board.
        :type y: int
        :return: None
        """
        super().__init__()
        self.width = 64
        self.height = 256
        self.x = x
        self.y = y
        if y == 0:
            self.rect = pg.Rect(x * 64, y * 64, self.width, self.height)
        elif y == 7:
            self.rect = pg.Rect(x * 64, 512 - (4 * 64), self.width, self.height)

        if y == 0:
            self.promotion_pieces = {
                "Queen": Queen("../assets/images/wQ.png", "white"),
                "Knight": Knight("../assets/images/wN.png", "white"),
                "Rook": Castle("../assets/images/wR.png", "white"),
                "Bishop": Bishop("../assets/images/wB.png", "white"),
            }
        elif y == 7:
            self.promotion_pieces = {
                "Queen": Queen("../assets/images/bQ.png", "black"),
                "Knight": Knight("../assets/images/bN.png", "black"),
                "Rook": Castle("../assets/images/bR.png", "black"),
                "Bishop": Bishop("../assets/images/bB.png", "black"),
            }

    def display_images(self, screen):
        """
        Display the images of the promotion pieces on the rectangle.

        This method displays the images of the promotion pieces on the GUI board within the rectangle.

        :param screen: The screen object to blit the images onto.
        :type screen: pg.Surface
        :return: None
        """
        for i, (_, piece) in enumerate(self.promotion_pieces.items()):
            image = piece.image
            image_rect = image.get_rect()
            if self.y == 0:
                image_rect.center = ((self.x * 64) + 32, (i * 64) + 32)
            elif self.y == 7:
                image_rect.center = ((self.x * 64) + 32, 512 - ((i * 64) + 32))
            screen.blit(image, image_rect)

    def assign_piece(self, former_piece):
        """
        Assign the selected promotion piece to the former piece.

        This method assigns the selected promotion piece to the former piece based on the user's mouse click within the rectangle.

        :param former_piece: The former piece to be replaced with the selected promotion piece.
        :type former_piece: Piece
        :return: The newly assigned promotion piece.
        :rtype: Piece
        """
        for event in pg.event.get():
            if event.type == pg.MOUSEBUTTONDOWN:
                x_pos, y_pos = pg.mouse.get_pos()

                if self.y == 0:
                    click = (x_pos // 64, y_pos // 64)
                if self.y == 7:
                    click = (x_pos // 64, (512 - y_pos) // 64)

                if click[0] == self.x:
                    former_piece = self.promotion_pieces[
                        list(self.promotion_pieces.keys())[click[1]]
                    ]
        return former_piece
