import { useState } from 'react';
import { socket } from '../utils/socket';
import { Spade, Heart, Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home({ sessionId }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Host options
  const [initialChips, setInitialChips] = useState(1000);
  const [gameMode, setGameMode] = useState('physical');
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return alert('Enter a name');
    socket.emit('createRoom', {
      hostId: sessionId,
      name,
      options: { initialChips, smallBlind, bigBlind, gameMode }
    }, (response) => {
      if (!response.success) alert('Failed to create room');
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name || !roomCode) return alert('Enter name and room code');
    socket.emit('joinRoom', {
      code: roomCode,
      playerId: sessionId,
      name
    }, (response) => {
      if (!response.success) alert(response.message);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 left-10 text-red-500/5"
      >
        <Heart size={160} />
      </motion.div>
      <motion.div 
        animate={{ rotate: -360, scale: [1, 1.2, 1] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 right-10 text-slate-500/5"
      >
        <Spade size={200} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, -20, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-1/4 text-emerald-500/5"
      >
        <Diamond size={100} />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] border border-slate-800 z-10"
      >
        <div className="flex justify-center items-center gap-3 mb-8">
          <Spade className="text-slate-300" size={32} />
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Pokler
          </h1>
          <Diamond className="text-red-400" size={32} />
        </div>

        <div className="flex gap-2 mb-6 bg-slate-950 p-1 rounded-xl relative">
          <motion.div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-md z-0"
            animate={{ left: isCreating ? '50%' : '4px' }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
          <button 
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors z-10 ${!isCreating ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setIsCreating(false)}
          >
            Join Room
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors z-10 ${isCreating ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setIsCreating(true)}
          >
            Create Room
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-100 placeholder-slate-600"
              placeholder="e.g. Maverick"
            />
          </div>

          <div className="min-h-[100px] relative">
            <AnimatePresence mode="wait">
              {!isCreating ? (
                <motion.div 
                  key="join"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute w-full"
                >
                  <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Room Code</label>
                  <input 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-100 placeholder-slate-600 font-mono tracking-widest uppercase"
                    placeholder="ABCD"
                    maxLength={4}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute w-full space-y-4"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Starting Chips</label>
                      <input 
                        type="number" 
                        value={initialChips}
                        onChange={(e) => setInitialChips(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-3 outline-none focus:border-emerald-500 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">Game Mode</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setGameMode('physical')}
                          className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${gameMode === 'physical' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-slate-950 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}
                        >
                          Physical Cards
                        </button>
                        <button
                          onClick={() => setGameMode('virtual')}
                          className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${gameMode === 'virtual' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}
                        >
                          Virtual Cards
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 ml-1 leading-tight">
                        {gameMode === 'physical' ? 'Use real playing cards at home. The app acts as the chips and dealer engine.' : 'The app deals standard 52-card decks, evaluates hands, and auto-awards the winner!'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isCreating ? handleCreate : handleJoin}
            className={`w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-colors ${isCreating ? 'mt-[130px]' : 'mt-4'}`}
          >
            {isCreating ? 'Create & Join' : 'Join Table'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
