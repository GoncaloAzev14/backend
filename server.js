const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { useAzureSocketIO } = require("@azure/web-pubsub-socket.io");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    credentials: true
  },
});

useAzureSocketIO(io, {
  hub: "my_hub", // The hub name can be any valid string.
  connectionString: process.argv[2]
});

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

server.listen(5000, () => console.log("server is running on port 5000"));

io.on("connection", async (socket) => {
  // teste
  // Emit the ID to the newly connected client
  socket.emit("me", socket.id);

  // Broadcast when a user disconnects
  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  // Handle calling a user
  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  // Handle answering a call
  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", {
      signal: data.signal,
      name: data.name,
    });
  });

  // Handle declining calls
  socket.on('callDeclined', (data) => {
    io.to(data.to).emit('callDeclined');
  });

  // Handle sending messages
  socket.on("message", (data) => {
    io.to(data.to).emit("message", { from: data.from, text: data.text });
  });

  // Broadcast when a user ends a call
  socket.on("endCall", () => {
    socket.broadcast.emit("callEnded");
  });
});