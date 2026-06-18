import { useState } from 'react';
import { socket } from '../utils/socket';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManualAwardModal({ roomState, sessionId, onClose }) {
  const [distributions, setDistributions] = useState({});

  const totalPot = roomState.pots.reduce((s, p) => s + p.amount, 0);
  const currentDistributed = Object.values(distributions).reduce((s, a) => s + (Number(a) || 0), 0);

  const handleSubmit = () => {
    const cleanDist = {};
    for (let id in distributions) {
      if (Number(distributions[id]) > 0) {
        cleanDist[id] = Number(distributions[id]);
      }
    }
    socket.emit('manualAward', {
      code: roomState.code,
      hostId: sessionId,
      distributions: cleanDist
    });
    onClose();
  };

  const activePlayers = roomState.players.filter(p => !p.folded && !p.disconnected);

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
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full hover:bg-slate-700">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-black text-slate-100 mb-2">Manual Award</h2>
        <p className="text-slate-400 text-sm mb-6">Distribute the total pot (<span className="text-amber-400 font-bold">${totalPot}</span>) manually.</p>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {activePlayers.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <span className="font-semibold text-slate-200 px-2">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">$</span>
                <input 
                  type="number"
                  min="0"
                  value={distributions[p.id] || ''}
                  onChange={(e) => setDistributions({...distributions, [p.id]: e.target.value})}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner font-mono font-bold"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Remaining</span>
            <span className={`text-2xl font-black ${totalPot - currentDistributed < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
              ${totalPot - currentDistributed}
            </span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={totalPot - currentDistributed < 0}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
          >
            Award Chips
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
