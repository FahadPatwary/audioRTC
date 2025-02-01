const socketIo = require('socket.io');

// Export the handler function for the API route
module.exports = (req, res) => {
  if (req.method === 'GET') {
    res.status(200).send('WebRTC signaling server is running!');
  } else {
    res.status(405).send('Method Not Allowed');
  }
};