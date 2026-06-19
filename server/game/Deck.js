class Deck {
  constructor() {
    this.cards = [];
    const suits = ['s', 'd', 'c', 'h'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    for (let suit of suits) {
      for (let rank of ranks) {
        this.cards.push(rank + suit);
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(num = 1) {
    let dealt = [];
    for (let i = 0; i < num; i++) dealt.push(this.cards.pop());
    return dealt;
  }
}
module.exports = Deck;
