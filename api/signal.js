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
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' https://audiortc.vercel.app wss://audiortc.vercel.app https://seriousserver-production.up.railway.app wss://seriousserver-production.up.railway.app"
  );
  next();
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("🎙️ WebRTC Signaling Server is Running!");
});

// Keep track of users in rooms
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("✅ [WebRTC] A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    
    // Add user to room tracking
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    // Notify others in the room
    socket.to(roomId).emit("userJoined", socket.id);
    
    console.log(`🔗 [WebRTC] User ${socket.id} joined room ${roomId}`);
    console.log(`👥 Room ${roomId} users:`, Array.from(rooms.get(roomId)));
  });

  socket.on("leaveRoom", (roomId) => {
    handleUserLeaving(socket, roomId);
  });

  socket.on("getPeers", (roomId, callback) => {
    const roomUsers = rooms.get(roomId) || new Set();
    const peers = Array.from(roomUsers).filter(id => id !== socket.id);
    console.log(`📋 [WebRTC] Sending peers to ${socket.id}:`, peers);
    callback(peers);
  });

  socket.on("webrtc-offer", ({ roomId, offer, to }) => {
    console.log(`📡 [WebRTC] Offer from ${socket.id} to ${to}`);
    console.log(`Room: ${roomId}, Offer:`, offer);
    io.to(to).emit("webrtc-offer", { 
      from: socket.id, 
      offer 
    });
  });

  socket.on("webrtc-answer", ({ roomId, answer, to }) => {
    console.log(`🎧 [WebRTC] Answer from ${socket.id} to ${to}`);
    console.log(`Room: ${roomId}, Answer:`, answer);
    io.to(to).emit("webrtc-answer", { 
      from: socket.id, 
      answer 
    });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate, to }) => {
    console.log(`❄️ [WebRTC] ICE Candidate from ${socket.id} to ${to}`);
    console.log(`Room: ${roomId}, Candidate:`, candidate);
    io.to(to).emit("webrtc-ice-candidate", { 
      from: socket.id, 
      candidate 
    });
  });

  socket.on("disconnect", () => {
    // Clean up all rooms this user was in
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        handleUserLeaving(socket, roomId);
      }
    }
    console.log(`❌ [WebRTC] User ${socket.id} disconnected`);
  });

  // Helper function to handle user leaving
  function handleUserLeaving(socket, roomId) {
    socket.leave(roomId);
    const roomUsers = rooms.get(roomId);
    if (roomUsers) {
      roomUsers.delete(socket.id);
      if (roomUsers.size === 0) {
        rooms.delete(roomId);
      }
      // Notify others that user has left
      socket.to(roomId).emit("userLeft", socket.id);
    }
    console.log(`🚪 [WebRTC] User ${socket.id} left room ${roomId}`);
    if (roomUsers) {
      console.log(`👥 Room ${roomId} remaining users:`, Array.from(roomUsers));
    }
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WebRTC signaling server is running on port ${PORT}`);
}); 