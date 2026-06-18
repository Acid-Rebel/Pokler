import { useState } from 'react';
import { socket } from '../utils/socket';
import { X, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShowdownModal({ roomState, sessionId, onClose }) {
  const [communityCards, setCommunityCards] = useState('');
  const [playerHands, setPlayerHands] = useState({});

  const activePlayers = roomState.players.filter(p => !p.folded && !p.disconnected);

  const handleSubmit = () => {
    const commCardsArr = communityCards.split(',').map(s => s.trim()).filter(Boolean);
    const parsedHands = {};
    for (let id in playerHands) {
      if (playerHands[id]) {
        parsedHands[id] = playerHands[id].split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    socket.emit('autoAward', {
      code: roomState.code,
      hostId: sessionId,
      communityCards: commCardsArr,
      playerHands: parsedHands
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full hover:bg-slate-700">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-black text-slate-100 mb-2">Auto Evaluate Showdown</h2>
        
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex gap-3 text-sm text-slate-300 mb-6 mt-4">
          <Info className="text-cyan-400 shrink-0 mt-0.5" size={18} />
          <p className="leading-relaxed">
            Enter cards using RankSuit format, separated by commas. 
            Valid ranks: <strong>2-9, 10, J, Q, K, A</strong>. 
            Valid suits: <strong>s, c, d, h</strong> (spades, clubs, diamonds, hearts). 
            <br/><span className="text-slate-400 text-xs mt-1 block">Example: As, Kd, 10c, 2h</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-300 mb-2 ml-1">Community Cards (Up to 5)</label>
          <input 
            type="text"
            value={communityCards}
            onChange={(e) => setCommunityCards(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono shadow-inner"
            placeholder="e.g. As, Kd, 10c, 2h, 3s"
          />
        </div>

        <div className="space-y-3 mb-8">
          <label className="block text-sm font-bold text-slate-300 ml-1">Player Hole Cards (2 each)</label>
          {activePlayers.map(p => (
            <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <span className="font-semibold text-slate-200 w-32 truncate px-2">{p.name}</span>
              <input 
                type="text"
                value={playerHands[p.id] || ''}
                onChange={(e) => setPlayerHands({...playerHands, [p.id]: e.target.value})}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm shadow-inner transition-all"
                placeholder="e.g. Ah, As"
              />
            </div>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-900/40 uppercase tracking-wider"
        >
          Evaluate & Award
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
