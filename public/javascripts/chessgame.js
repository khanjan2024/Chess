const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const gameStatusElement = document.getElementById("gameStatus");
const playerInfoElement = document.getElementById("playerInfo");
const moveHistoryElement = document.getElementById("moveHistory");
const capturedPiecesElement = document.getElementById("capturedPieces");
const resetButton = document.getElementById("resetGame");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let capturedPieces = { w: [], b: [] };

// Initialize the board immediately
const initializeBoard = () => {
    if (!boardElement) {
        console.error("Chessboard element not found!");
        return;
    }
    
    // Clear any existing content
    boardElement.innerHTML = "";
    
    // Create the 8x8 grid
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (row + col) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = row;
            squareElement.dataset.column = col;
            boardElement.appendChild(squareElement);
        }
    }
};

const renderBoard = () => {
    if (!boardElement) {
        console.error("Chessboard element not found!");
        return;
    }

    const board = chess.board();
    const squares = boardElement.children;

    // Update each square
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const squareElement = squares[row * 8 + col];
            const square = board[row][col];

            // Clear the square
            squareElement.innerHTML = "";

            // Add piece if present
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row, col };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            // Add drag and drop event listeners
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.column),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });
        }
    }

    // Update board orientation
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }

    updateGameStatus();
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: "♔", K: "♚",
        q: "♕", Q: "♛",
        r: "♖", R: "♜",
        b: "♗", B: "♝",
        n: "♘", N: "♞",
        p: "♙", P: "♟",
    };
    return unicodePieces[piece.type] || "";
};

const updateGameStatus = () => {
    let status = "";
    if (chess.isCheckmate()) {
        status = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    } else if (chess.isDraw()) {
        status = "Game ended in a draw!";
    } else if (chess.isCheck()) {
        status = `${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`;
    } else {
        status = `${chess.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    }
    gameStatusElement.textContent = status;
};

const updatePlayerInfo = () => {
    if (playerRole === 'w') {
        playerInfoElement.textContent = "You are playing as White";
    } else if (playerRole === 'b') {
        playerInfoElement.textContent = "You are playing as Black";
    } else {
        playerInfoElement.textContent = "You are spectating";
    }
};

const updateMoveHistory = () => {
    const history = chess.history({ verbose: true });
    moveHistoryElement.innerHTML = history.map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhite = index % 2 === 0;
        return `<div class="text-sm">
            ${isWhite ? `${moveNumber}.` : ''} ${move.from} → ${move.to}
            ${move.captured ? ` (captured ${move.captured})` : ''}
        </div>`;
    }).join('');
    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
};

const updateCapturedPieces = () => {
    const history = chess.history({ verbose: true });
    capturedPieces = { w: [], b: [] };
    
    history.forEach(move => {
        if (move.captured) {
            const piece = getPieceUnicode({ type: move.captured, color: move.color === 'w' ? 'b' : 'w' });
            if (move.color === 'w') {
                capturedPieces.b.push(piece);
            } else {
                capturedPieces.w.push(piece);
            }
        }
    });

    capturedPiecesElement.innerHTML = `
        <div class="text-white">White captured: ${capturedPieces.w.join(' ')}</div>
        <div class="text-black">Black captured: ${capturedPieces.b.join(' ')}</div>
    `;
};

socket.on("playerRole", function(role) {
    playerRole = role;
    updatePlayerInfo();
    renderBoard();
});

socket.on("spectatorRole", function() {
    playerRole = null;
    updatePlayerInfo();
    renderBoard();
});

socket.on("boardState", function(fen) {
    chess.load(fen);
    renderBoard();
    updateMoveHistory();
    updateCapturedPieces();
});

socket.on("move", function(move) {
    chess.move(move);
    renderBoard();
    updateMoveHistory();
    updateCapturedPieces();
});

resetButton.addEventListener("click", () => {
    socket.emit("resetGame");
});

socket.on("gameReset", () => {
    chess.reset();
    renderBoard();
    updateMoveHistory();
    updateCapturedPieces();
});

// Initialize the board when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    renderBoard();
});