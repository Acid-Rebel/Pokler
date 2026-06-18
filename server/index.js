const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const RoomManager = require('./game/RoomManager');
const PokerLogic = require('./game/PokerLogic');

const app = express();
app.use(cors());

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
    io.to(room.code).emit('roomState', room.getPublicState());
  });

  socket.on('joinRoom', ({ code, playerId, name }, callback) => {
    const room = RoomManager.getRoom(code.toUpperCase());
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    room.addPlayer(playerId, name, socket.id);
    socket.join(room.code);
    callback({ success: true });
    io.to(room.code).emit('roomState', room.getPublicState());
  });

  socket.on('startHand', ({ code, hostId }) => {
    const room = RoomManager.getRoom(code);
    if (room && room.hostId === hostId) {
      room.startHand();
      io.to(code).emit('roomState', room.getPublicState());
    }
  });

  socket.on('bet', ({ code, playerId, amount }) => {
    const room = RoomManager.getRoom(code);
    if (room) {
      const success = room.bet(playerId, amount);
      if (success) io.to(code).emit('roomState', room.getPublicState());
    }
  });

  socket.on('fold', ({ code, playerId }) => {
    const room = RoomManager.getRoom(code);
    if (room) {
      const success = room.fold(playerId);
      if (success) io.to(code).emit('roomState', room.getPublicState());
    }
  });

  socket.on('manualAward', ({ code, hostId, distributions }) => {
    const room = RoomManager.getRoom(code);
    if (room && room.hostId === hostId) {
      room.manuallyDistribute(distributions);
      io.to(code).emit('roomState', room.getPublicState());
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
        io.to(code).emit('roomState', room.getPublicState());
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
        io.to(code).emit('roomState', room.getPublicState());
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
