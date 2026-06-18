const Room = require('./Room');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateRoomCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  createRoom(options) {
    let code;
    do {
      code = this.generateRoomCode();
    } while (this.rooms.has(code));

    const room = new Room(code, options);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }
}

module.exports = new RoomManager();
