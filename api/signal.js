const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins (you can restrict this)
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Basic route to check server status
app.get('/', (req, res) => {
  res.send('🎙️ WebRTC Signaling Server is Running!');
});

// WebRTC signaling with room-based audio sharing
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`🔗 User ${socket.id} joined room ${roomId}`);
  });

  // Handle leaving a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 User ${socket.id} left room ${roomId}`);
  });

  // Handle offer (only broadcast within the same room)
  socket.on('offer', ({ roomId, offer }) => {
    console.log(`📡 Offer received for Room ${roomId}`);
    socket.to(roomId).emit('offer', offer);
  });

  // Handle answer (only broadcast within the same room)
  socket.on('answer', ({ roomId, answer }) => {
    console.log(`🎧 Answer received for Room ${roomId}`);
    socket.to(roomId).emit('answer', answer);
  });

  // Handle ICE candidates (only broadcast within the same room)
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    console.log(`❄️ ICE Candidate for Room ${roomId}`);
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.id} disconnected`);
  });
});

// Serverless function handler for Vercel
module.exports = (req, res) => {
  server.emit('request', req, res);
};
