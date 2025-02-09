const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎙️ WebRTC Signaling Server is Running!");
});

io.on("connection", (socket) => {
  console.log("✅ [WebRTC] A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    try {
      socket.join(roomId);
      console.log(`🔗 [WebRTC] User ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error(`❌ Error joining room ${roomId}:`, error);
    }
  });

  socket.on("leaveRoom", (roomId) => {
    try {
      socket.leave(roomId);
      console.log(`🚪 [WebRTC] User ${socket.id} left room ${roomId}`);
    } catch (error) {
      console.error(`❌ Error leaving room ${roomId}:`, error);
    }
  });

  socket.on("webrtc-offer", ({ roomId, offer, to }) => {
    try {
      console.log(`📡 [WebRTC] Offer from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-offer", { from: socket.id, offer });
    } catch (error) {
      console.error(`❌ Error sending offer from ${socket.id} to ${to}:`, error);
    }
  });

  socket.on("webrtc-answer", ({ roomId, answer, to }) => {
    try {
      console.log(`🎧 [WebRTC] Answer from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-answer", { from: socket.id, answer });
    } catch (error) {
      console.error(`❌ Error sending answer from ${socket.id} to ${to}:`, error);
    }
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate, to }) => {
    try {
      console.log(`❄️ [WebRTC] ICE Candidate from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
    } catch (error) {
      console.error(`❌ Error sending ICE candidate from ${socket.id} to ${to}:`, error);
    }
  });

  socket.on("getPeers", (roomId, callback) => {
    try {
      const room = io.sockets.adapter.rooms.get(roomId);
      const clients = room ? Array.from(room) : [];
      callback(clients);
    } catch (error) {
      console.error(`❌ Error getting peers in room ${roomId}:`, error);
      callback([]);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ [WebRTC] User ${socket.id} disconnected`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebRTC signaling server is running on port ${PORT}`);
});
