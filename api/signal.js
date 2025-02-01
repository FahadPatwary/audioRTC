const { Server } = require('socket.io');

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).send('WebRTC Signaling Server');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

// Socket.io server setup for signaling
const io = new Server(res.socket.server, {
  path: '/api/socket',
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Forward offer from one user to another
  socket.on('offer', (offer) => {
    console.log('Received offer:', offer);
    socket.broadcast.emit('offer', offer);
  });

  // Forward answer from one user to another
  socket.on('answer', (answer) => {
    console.log('Received answer:', answer);
    socket.broadcast.emit('answer', answer);
  });

  // Forward ICE candidates from one user to another
  socket.on('ice-candidate', (candidate) => {
    console.log('Received ICE candidate:', candidate);
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});