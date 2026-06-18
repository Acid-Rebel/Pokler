const Player = require('./Player');

class Room {
  constructor(code, options) {
    this.code = code;
    this.hostId = null;
    this.players = [];
    this.state = 'WAITING'; // WAITING, PLAYING, SHOWDOWN
    
    this.initialChips = parseInt(options.initialChips) || 1000;
    this.smallBlind = parseInt(options.smallBlind) || 10;
    this.bigBlind = parseInt(options.bigBlind) || 20;

    this.pots = []; // [{ amount: 0, eligiblePlayers: [] }]
    this.dealerIndex = -1;
    this.currentTurnIndex = -1;
    this.highestBet = 0;
    this.roundBets = {}; // playerId -> amount
    this.minRaise = this.bigBlind;
    this.lastRaiserIndex = -1;
  }

  addPlayer(id, name, socketId) {
    let player = this.players.find(p => p.id === id);
    if (player) {
      player.socketId = socketId;
      player.disconnected = false;
      player.name = name; // update name
    } else {
      player = new Player(id, name, this.players.length === 0);
      player.socketId = socketId;
      if (player.isHost) this.hostId = id;
      player.chips = this.initialChips;
      this.players.push(player);
    }
    return player;
  }

  removePlayer(id) {
    const player = this.players.find(p => p.id === id);
    if (player) {
      player.disconnected = true;
      player.socketId = null;
      // If we are waiting, just remove them
      if (this.state === 'WAITING') {
        this.players = this.players.filter(p => p.id !== id);
      } else if (this.currentTurnIndex !== -1 && this.players[this.currentTurnIndex]?.id === id) {
         this.fold(id); // auto-fold if it's their turn
      }
    }
  }

  startHand() {
    if (this.players.length < 2) return false;

    this.state = 'PLAYING';
    this.pots = [{ amount: 0, eligiblePlayers: [] }];
    this.roundBets = {};
    this.highestBet = 0;
    this.minRaise = this.bigBlind;
    this.lastRaiserIndex = -1;

    // Reset players
    this.players.forEach(p => {
      p.resetForNewHand();
      this.roundBets[p.id] = 0;
      if (!p.disconnected) this.pots[0].eligiblePlayers.push(p.id);
    });

    // Move dealer button
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    while(this.players[this.dealerIndex].disconnected || this.players[this.dealerIndex].chips === 0) {
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    }

    // Post blinds
    const sbIndex = this.getNextActivePlayerIndex(this.dealerIndex);
    const bbIndex = this.getNextActivePlayerIndex(sbIndex);

    this.placeBetInternal(this.players[sbIndex], this.smallBlind, true);
    this.placeBetInternal(this.players[bbIndex], this.bigBlind, true);

    this.highestBet = this.bigBlind;
    this.lastRaiserIndex = bbIndex;
    
    this.currentTurnIndex = this.getNextActivePlayerIndex(bbIndex);

    return true;
  }

  getNextActivePlayerIndex(startIndex) {
    let index = (startIndex + 1) % this.players.length;
    while(this.players[index].folded || this.players[index].allIn || this.players[index].disconnected || this.players[index].chips === 0) {
      index = (index + 1) % this.players.length;
      if (index === startIndex) return -1; // everyone else folded/all-in
    }
    return index;
  }

  getActivePlayers() {
    return this.players.filter(p => !p.folded && !p.disconnected && p.chips > 0);
  }

  getUnfoldedPlayers() {
    return this.players.filter(p => !p.folded && !p.disconnected);
  }

  placeBetInternal(player, amount, isBlind = false) {
    const actualBet = Math.min(amount, player.chips);
    player.chips -= actualBet;
    player.currentBet += actualBet;
    this.roundBets[player.id] += actualBet;
    if (player.chips === 0) {
      player.allIn = true;
    }
    return actualBet;
  }

  bet(playerId, amount) {
    if (this.state !== 'PLAYING') return false;
    if (this.players[this.currentTurnIndex].id !== playerId) return false;

    const player = this.players[this.currentTurnIndex];
    
    // amount is the TOTAL they want to put in this round.
    // actual call amount needed: this.highestBet - this.roundBets[playerId]
    const currentContribution = this.roundBets[playerId];
    let toAdd = amount - currentContribution;

    if (toAdd < 0) return false; // Can't bet less than you already have

    // Check valid raise (except all-in)
    if (amount > this.highestBet && amount < this.highestBet + this.minRaise && toAdd < player.chips) {
        return false; // Invalid raise amount
    }

    const actualAdded = this.placeBetInternal(player, toAdd);

    if (this.roundBets[playerId] > this.highestBet) {
       this.minRaise = Math.max(this.minRaise, this.roundBets[playerId] - this.highestBet);
       this.highestBet = this.roundBets[playerId];
       this.lastRaiserIndex = this.currentTurnIndex;
    }

    this.advanceTurn();
    return true;
  }

  fold(playerId) {
    if (this.state !== 'PLAYING') return false;
    if (this.players[this.currentTurnIndex].id !== playerId) return false;

    const player = this.players[this.currentTurnIndex];
    player.folded = true;

    // Remove from eligible pots
    this.pots.forEach(pot => {
      pot.eligiblePlayers = pot.eligiblePlayers.filter(id => id !== playerId);
    });

    const unfolded = this.getUnfoldedPlayers();
    if (unfolded.length === 1) {
      this.resolveRound();
      this.awardPot(unfolded[0].id);
      this.state = 'WAITING';
      return true;
    }

    this.advanceTurn();
    return true;
  }

  advanceTurn() {
    let nextIndex = this.getNextActivePlayerIndex(this.currentTurnIndex);
    
    if (nextIndex === -1 || nextIndex === this.lastRaiserIndex || 
        (this.highestBet === 0 && nextIndex === this.getNextActivePlayerIndex(this.dealerIndex))) {
        // Round ends
        this.resolveRound();
        
        const active = this.getActivePlayers();
        if (active.length <= 1) {
            this.state = 'SHOWDOWN';
            this.currentTurnIndex = -1;
        } else {
            // New betting round
            this.highestBet = 0;
            this.minRaise = this.bigBlind;
            this.players.forEach(p => { p.currentBet = 0; this.roundBets[p.id] = 0; });
            this.currentTurnIndex = this.getNextActivePlayerIndex(this.dealerIndex);
            this.lastRaiserIndex = this.currentTurnIndex;
        }
    } else {
        this.currentTurnIndex = nextIndex;
    }
  }

  resolveRound() {
    // Collect bets into pots, handle side pots
    let amounts = Object.values(this.roundBets).filter(a => a > 0).sort((a, b) => a - b);
    let uniqueAmounts = [...new Set(amounts)];

    let processedAmount = 0;
    
    for (let currentCap of uniqueAmounts) {
      let capDiff = currentCap - processedAmount;
      let currentPot = this.pots[this.pots.length - 1];
      
      for (let playerId in this.roundBets) {
        if (this.roundBets[playerId] >= currentCap) {
           currentPot.amount += capDiff;
        }
      }
      processedAmount = currentCap;

      // Check if anyone is all-in at this cap
      let allInAtCap = this.players.find(p => p.allIn && this.roundBets[p.id] === currentCap);
      if (allInAtCap) {
         // Create a new side pot
         let eligible = this.players.filter(p => !p.folded && this.roundBets[p.id] > currentCap).map(p => p.id);
         if (eligible.length > 0) {
            this.pots.push({ amount: 0, eligiblePlayers: eligible });
         }
      }
    }
    
    // Reset round bets
    this.players.forEach(p => { p.currentBet = 0; this.roundBets[p.id] = 0; });
  }

  awardPot(winnerId) {
    const winner = this.players.find(p => p.id === winnerId);
    if (!winner) return;

    this.pots.forEach(pot => {
      if (pot.eligiblePlayers.includes(winnerId)) {
        winner.chips += pot.amount;
        pot.amount = 0;
      }
    });
    
    // if there's remaining pot amounts (split pots or winner wasn't eligible for side pot)
    // For simplicity in manual mode, host can adjust chips manually if needed, or we just award what they are eligible for.
  }
  
  manuallyDistribute(distributions) {
    // distributions: { playerId: amount }
    for(let pid in distributions) {
        let p = this.players.find(p => p.id === pid);
        if(p) p.chips += distributions[pid];
    }
    this.pots = [{amount: 0, eligiblePlayers: []}];
    this.state = 'WAITING';
  }

  getPublicState() {
    return {
      code: this.code,
      hostId: this.hostId,
      state: this.state,
      initialChips: this.initialChips,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      pots: this.pots,
      dealerIndex: this.dealerIndex,
      currentTurnIndex: this.currentTurnIndex,
      highestBet: this.highestBet,
      minRaise: this.minRaise,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        chips: p.chips,
        currentBet: p.currentBet,
        folded: p.folded,
        allIn: p.allIn,
        disconnected: p.disconnected
      }))
    };
  }
}

module.exports = Room;
