import { useState } from 'react';
import { socket } from '../utils/socket';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

export default function Home({ sessionId }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Host options
  const [initialChips, setInitialChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return alert('Enter a name');
    socket.emit('createRoom', {
      hostId: sessionId,
      name,
      options: { initialChips, smallBlind, bigBlind }
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-red-500/10 rotate-12"><Heart size={120} /></div>
      <div className="absolute bottom-10 right-10 text-slate-500/10 -rotate-12"><Spade size={160} /></div>
      
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-700 z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
          <Spade className="text-slate-300" size={32} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Pokler
          </h1>
          <Diamond className="text-red-400" size={32} />
        </div>

        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${!isCreating ? 'bg-slate-700 shadow-md text-white' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setIsCreating(false)}
          >
            Join Room
          </button>
          <button 
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${isCreating ? 'bg-slate-700 shadow-md text-white' : 'text-slate-400 hover:text-slate-200'}`}
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-100 placeholder-slate-600"
              placeholder="e.g. Maverick"
            />
          </div>

          {!isCreating ? (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">Room Code</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-slate-100 placeholder-slate-600 font-mono tracking-widest uppercase"
                placeholder="ABCD"
                maxLength={4}
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Starting Chips</label>
                  <input 
                    type="number" 
                    value={initialChips}
                    onChange={(e) => setInitialChips(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Small Blind</label>
                  <input 
                    type="number" 
                    value={smallBlind}
                    onChange={(e) => setSmallBlind(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Big Blind</label>
                  <input 
                    type="number" 
                    value={bigBlind}
                    onChange={(e) => setBigBlind(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={isCreating ? handleCreate : handleJoin}
            className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isCreating ? 'Create & Join' : 'Join Table'}
          </button>
        </div>
      </div>
    </div>
  );
}
