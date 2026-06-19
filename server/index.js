const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const RoomManager = require('./game/RoomManager');
const PokerLogic = require('./game/PokerLogic');

function broadcastRoomState(room, io) {
  room.players.forEach(p => {
    if (p.socketId) {
      io.to(p.socketId).emit('roomState', room.getPublicState(p.id));
    }
  });
}

const app = express();
app.use(cors());

// Health check endpoint for keep-alive bots
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ hostId, name, options }, callback) => {
    const room = RoomManager.createRoom(options);
    const player = room.addPlayer(hostId, name, socket.id);
    socket.join(room.code);
    callback({ success: true, code: room.code });
    broadcastRoomState(room, io);
  });

  socket.on('joinRoom', ({ code, playerId, name }, callback) => {
    const room = RoomManager.getRoom(code.toUpperCase());
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    room.addPlayer(playerId, name, socket.id);
    socket.join(room.code);
    callback({ success: true });
    broadcastRoomState(room, io);
  });

  socket.on('startHand', ({ code, hostId }) => {
    const room = RoomManager.getRoom(code);
    if (room && room.hostId === hostId) {
      room.startHand();
      broadcastRoomState(room, io);
    }
  });

  socket.on('bet', ({ code, playerId, amount }) => {
    const room = RoomManager.getRoom(code);
    if (room) {
      const success = room.bet(playerId, amount);
      if (success) broadcastRoomState(room, io);
    }
  });

  socket.on('fold', ({ code, playerId }) => {
    const room = RoomManager.getRoom(code);
    if (room) {
      const success = room.fold(playerId);
      if (success) broadcastRoomState(room, io);
    }
  });

  socket.on('manualAward', ({ code, hostId, distributions }) => {
    const room = RoomManager.getRoom(code);
    if (room && room.hostId === hostId) {
      room.manuallyDistribute(distributions);
      broadcastRoomState(room, io);
    }
  });

  socket.on('autoAward', ({ code, hostId, communityCards, playerHands }) => {
    const room = RoomManager.getRoom(code);
    if (room && room.hostId === hostId) {
      const winners = PokerLogic.evaluateWinner(communityCards, playerHands);
      if (winners.length > 0) {
        room.pots.forEach(pot => {
          const eligibleWinners = winners.filter(w => pot.eligiblePlayers.includes(w));
          if (eligibleWinners.length > 0) {
            const splitAmount = Math.floor(pot.amount / eligibleWinners.length);
            eligibleWinners.forEach(wId => {
              const p = room.players.find(p => p.id === wId);
              if (p) p.chips += splitAmount;
            });
            pot.amount -= splitAmount * eligibleWinners.length; // Handle rounding errors, leave remainder in pot or ignore
          }
        });
        room.state = 'WAITING';
        broadcastRoomState(room, io);
        io.to(code).emit('winnersAnnounced', { winners });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [code, room] of RoomManager.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        room.removePlayer(player.id);
        broadcastRoomState(room, io);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
