const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { error } = require("console");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniqueSocket) => {
  // to send somthing toward the frontend
  //   uniqueSocket.on("muneeb", () => {
  //     console.log("Message Received");
  //     io.emit("Muneeb message received");
  //   });

  console.log("connected");

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
    console.log(players.black);
  } else {
    uniqueSocket.emit("spectatorRole", null);
    io.emit("spectator Connected");
  }

  uniqueSocket.on("disconnect", () => {
    if (uniqueSocket.id === players.white) {
      delete players.white;
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
    } else {
      uniqueSocket.on("spectator leave", () => {
        io.emit("spectator leave");
      });
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("invalid move");
        uniqueSocket.emit("InvalidMOve,move", move);
      }
    } catch (error) {
      console.log(error);
      uniqueSocket.emit("InvalidMOve,move", move);
    }
  });
});

const port = 3000;

server.listen(port, (req, res) => {
  console.log("connected on port:3000");
});
