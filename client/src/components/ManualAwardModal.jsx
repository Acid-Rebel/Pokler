import { useState } from 'react';
import { socket } from '../utils/socket';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Manual Award</h2>
        <p className="text-slate-400 text-sm mb-6">Distribute the total pot (${totalPot}) manually.</p>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {activePlayers.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700/50">
              <span className="font-medium text-slate-200">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">$</span>
                <input 
                  type="number"
                  min="0"
                  value={distributions[p.id] || ''}
                  onChange={(e) => setDistributions({...distributions, [p.id]: e.target.value})}
                  className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-400">Remaining: </span>
            <span className={`font-bold ${totalPot - currentDistributed < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${totalPot - currentDistributed}
            </span>
          </div>
          <button 
            onClick={handleSubmit}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg"
          >
            Award Chips
          </button>
        </div>
      </div>
    </div>
  );
}
