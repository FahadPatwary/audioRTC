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

// Add the CSP header
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "connect-src 'self' https://audiortc-48b39feib-fahadpatwarys-projects.vercel.app wss://audiortc-48b39feib-fahadpatwarys-projects.vercel.app https://seriousserver-production.up.railway.app wss://seriousserver-production.up.railway.app");
  next();
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎙️ WebRTC Signaling Server is Running!");
});

io.on("connection", (socket) => {
  console.log("✅ [WebRTC] A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`🔗 [WebRTC] User ${socket.id} joined room ${roomId}`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 [WebRTC] User ${socket.id} left room ${roomId}`);
  });

  socket.on("webrtc-offer", ({ roomId, offer, to }) => {
    console.log(`📡 [WebRTC] Offer from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-offer", { from: socket.id, offer });
  });

  socket.on("webrtc-answer", ({ roomId, answer, to }) => {
    console.log(`🎧 [WebRTC] Answer from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-answer", { from: socket.id, answer });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate, to }) => {
    console.log(`❄️ [WebRTC] ICE Candidate from ${socket.id} to ${to}`);
    io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
  });

  socket.on("getPeers", (roomId, callback) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const clients = room ? Array.from(room) : [];
    callback(clients);
  });

  socket.on("disconnect", () => {
    console.log(`❌ [WebRTC] User ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebRTC signaling server is running on port ${PORT}`);
});
