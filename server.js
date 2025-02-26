const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    socket.to(roomId).emit("user-connected", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-disconnected", socket.id);
    });
  });

  socket.on("offer", ({ offer, to }) => {
    io.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    io.to(to).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
