# Pokler ♠️♥️♣️♦️

Pokler is a modern, real-time multiplayer Poker web application designed to bring the premium casino experience directly to your browser. Whether you are playing with physical cards at home and need a digital dealer to track chips and pots, or you want a fully automated virtual poker room, Pokler handles it all.

## ✨ Features

- **Two Game Modes**:
  - 🃏 **Physical Cards**: Play with real cards at the table! Pokler acts as the ultimate digital dealer—managing chips, blind structures, side pots, and betting rounds flawlessly without needing a physical chip set.
  - 💻 **Virtual Cards**: Let the app do everything. Pokler features an automated deck engine that securely deals private hole cards, reveals community cards (Flop, Turn, River), and utilizes a robust poker algorithm to auto-evaluate winning hands and instantly distribute pots.
- **Advanced Game Engine**: Supports complex edge cases such as multi-way All-Ins, strictly isolated Side Pots, and exact split-pot payouts based on standard Texas Hold'em rules.
- **Real-Time Multiplayer**: Instant state synchronization across all players using WebSockets, ensuring seamless action and secure card-hiding.
- **Premium UI/UX**: Built with a stunning dark-mode aesthetic, smooth gradients, and interactive micro-animations to deliver a highly engaging experience.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TailwindCSS (for styling), Framer Motion (for dynamic UI animations)
- **Backend**: Node.js, Express, Socket.io
- **Game Engine Logic**: Custom state-machine with `pokersolver` for accurate hand evaluation.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. Clone the repository and navigate into the project directory.
2. Install dependencies for both the client and server:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### Running the Application

You will need to run both the backend server and the frontend client simultaneously.

**1. Start the Server:**
```bash
cd server
node index.js
```
*(The server will start listening on port 3001)*

**2. Start the Client:**
Open a new terminal and run:
```bash
cd client
npm run dev
```

Visit the `localhost` link provided by Vite in your browser to start playing!

## 🎲 How to Play

1. **Create a Room**: The host creates a room, sets the initial chip count, the blinds, and selects the desired Game Mode.
2. **Join Table**: Other players join using the unique 4-letter Room Code.
3. **Start Hand**: The host starts the hand from the Host Controls panel.
4. **Action**: Players take turns Checking, Calling, Raising, Folding, or going All-In.
5. **Showdown**: In Virtual Mode, the server evaluates the winner and handles payouts. In Physical Mode, the host can manually award the pot to the winner based on the real cards shown.

## 📝 License
This project is open-source and available under the MIT License.
