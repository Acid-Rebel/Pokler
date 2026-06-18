class Player {
  constructor(id, name, isHost = false) {
    this.id = id; // sessionId
    this.name = name;
    this.isHost = isHost;
    this.chips = 0;
    this.currentBet = 0;
    this.folded = false;
    this.allIn = false;
    this.disconnected = false;
    this.socketId = null;
  }

  resetForNewHand() {
    this.currentBet = 0;
    this.folded = false;
    this.allIn = this.chips === 0;
  }
}

module.exports = Player;
