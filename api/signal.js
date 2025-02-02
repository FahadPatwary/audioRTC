const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // You can restrict this in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('🎙️ WebRTC Signaling Server is Running!');
});

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Handle joining a room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`🔗 User ${socket.id} joined room ${roomId}`);
  });

  // Handle leaving a room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 User ${socket.id} left room ${roomId}`);
  });

  // Handle offer
  socket.on('webrtc-offer', ({ roomId, offer, to }) => {
    console.log(`📡 Offer received from ${socket.id} for ${to}`);
    io.to(to).emit('webrtc-offer', { from: socket.id, offer });
  });

  // Handle answer
  socket.on('webrtc-answer', ({ roomId, answer, to }) => {
    console.log(`🎧 Answer received from ${socket.id} for ${to}`);
    io.to(to).emit('webrtc-answer', { from: socket.id, answer });
  });

  // Handle ICE candidates
  socket.on('webrtc-ice-candidate', ({ roomId, candidate, to }) => {
    console.log(`❄️ ICE Candidate from ${socket.id} for ${to}`);
    io.to(to).emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  // Handle request for peers in a room
  socket.on('getPeers', (roomId, callback) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    callback(clients);
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.id} disconnected`);
  });
});

const PORT = 3001; // Port for the signaling server
server.listen(PORT, () => {
  console.log(`🚀 Signaling server is running on port ${PORT}`);
});
