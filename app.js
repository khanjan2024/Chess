const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require("chess.js");
const path = require('path');
const { title, disconnect } = require('process');
const { log } = require('console');
const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let CurrentPlayer = "w";

app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" })
});
io.on("connection", function (socket) {
    console.log("New player connected:", socket.id);
    
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
        console.log("Assigned white to:", socket.id);
    }
    else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
        console.log("Assigned black to:", socket.id);
    } else {
        socket.emit("spectatorRole");
        console.log("Assigned spectator role to:", socket.id);
    }

    // Send current board state to new player
    socket.emit("boardState", chess.fen());

    socket.on("disconnect", function () {
        console.log("Player disconnected:", socket.id);
        if (socket.id === players.white) {
            delete players.white;
            console.log("White player disconnected");
        }
        else if (socket.id === players.black) {
            delete players.black;
            console.log("Black player disconnected");
        }
    });
    socket.on("move", (move) => {
        try {
            // Validate player's turn
            if (chess.turn() === "w" && socket.id !== players.white) {
                socket.emit("error", "Not your turn");
                return;
            }
            if (chess.turn() === "b" && socket.id !== players.black) {
                socket.emit("error", "Not your turn");
                return;
            }

            const result = chess.move(move);
            if (result) {
                CurrentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
                console.log("Move made:", move);
            }
            else {
                console.log("Invalid move:", move);
                socket.emit("error", "Invalid move");
            }
        }
        catch (err) {
            console.log("Error making move:", err);
            socket.emit("error", "Error making move");
        }
    })

    socket.on("resetGame", () => {
        // Only allow reset if both players are present
        if (players.white && players.black) {
            chess.reset();
            CurrentPlayer = "w";
            io.emit("gameReset");
            io.emit("boardState", chess.fen());
            console.log("Game reset by:", socket.id);
        } else {
            socket.emit("error", "Cannot reset game: waiting for players");
        }
    });
})
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});