const Hand = require('pokersolver').Hand;

class PokerLogic {
  // Cards should be in format like 'As', '10d', '7c', 'Jh'
  static evaluateWinner(communityCards, playerHands) {
    let hands = [];
    let playerMap = new Map();
    
    for (let playerId in playerHands) {
      if (playerHands[playerId] && playerHands[playerId].length === 2) {
        const cards = communityCards.concat(playerHands[playerId]);
        const solved = Hand.solve(cards);
        hands.push(solved);
        playerMap.set(solved, playerId);
      }
    }
    
    if (hands.length === 0) return [];
    
    const winners = Hand.winners(hands);
    return winners.map(w => playerMap.get(w));
  }
}

module.exports = PokerLogic;
