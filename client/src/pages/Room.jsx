import { useState, useMemo } from 'react';
import { socket } from '../utils/socket';
import { Crown, Play, Trophy, HandCoins, User } from 'lucide-react';
import ShowdownModal from '../components/ShowdownModal';
import ManualAwardModal from '../components/ManualAwardModal';

export default function Room({ sessionId, roomState }) {
  const [showAutoAward, setShowAutoAward] = useState(false);
  const [showManualAward, setShowManualAward] = useState(false);
  const [betAmount, setBetAmount] = useState(0);

  const me = roomState.players.find(p => p.id === sessionId);
  const isHost = me?.isHost;
  const isMyTurn = roomState.state === 'PLAYING' && roomState.players[roomState.currentTurnIndex]?.id === sessionId;

  const totalPot = useMemo(() => roomState.pots.reduce((sum, pot) => sum + pot.amount, 0), [roomState.pots]);
  const currentHighestBet = roomState.highestBet;
  const callAmount = Math.max(0, currentHighestBet - (me?.currentBet || 0));
  const minRaise = roomState.minRaise;

  const handleStartHand = () => {
    socket.emit('startHand', { code: roomState.code, hostId: sessionId });
  };

  const handleFold = () => {
    socket.emit('fold', { code: roomState.code, playerId: sessionId });
  };

  const handleCall = () => {
    socket.emit('bet', { code: roomState.code, playerId: sessionId, amount: currentHighestBet });
  };

  const handleRaise = (amount) => {
    socket.emit('bet', { code: roomState.code, playerId: sessionId, amount: amount });
  };

  const handleAllIn = () => {
    socket.emit('bet', { code: roomState.code, playerId: sessionId, amount: me.chips + me.currentBet });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row">
      {/* Sidebar / Topbar */}
      <div className="md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">Pokler</h2>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-slate-400">Room Code:</span>
            <span className="bg-slate-800 px-2 py-1 rounded font-mono font-bold tracking-widest text-emerald-400">{roomState.code}</span>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 shadow-inner">
            <div className="text-sm text-slate-400 mb-1">Total Pot</div>
            <div className="text-3xl font-black text-amber-400">${totalPot}</div>
            {roomState.pots.length > 1 && (
              <div className="mt-2 text-xs text-slate-500 space-y-1">
                {roomState.pots.map((pot, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>Pot {idx+1}</span>
                    <span className="text-amber-500/80">${pot.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isHost && (
          <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Crown size={16} className="text-amber-400"/> Host Controls</h3>
            {roomState.state === 'WAITING' && (
              <button 
                onClick={handleStartHand}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors"
              >
                <Play size={18} /> Start Hand
              </button>
            )}
            {(roomState.state === 'SHOWDOWN' || roomState.state === 'WAITING') && totalPot > 0 && (
              <>
                <button 
                  onClick={() => setShowAutoAward(true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors"
                >
                  <Trophy size={18} /> Auto Evaluate
                </button>
                <button 
                  onClick={() => setShowManualAward(true)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors"
                >
                  <HandCoins size={18} /> Manual Award
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col">
        <div className="flex-1 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 flex flex-col justify-center items-center relative overflow-hidden shadow-2xl">
          {/* Table Graphics */}
          <div className="absolute inset-4 md:inset-10 border-8 border-slate-800 rounded-[4rem] md:rounded-[8rem] bg-emerald-950/20 shadow-inner flex items-center justify-center">
            {roomState.state === 'WAITING' && <div className="text-2xl text-emerald-900/40 font-black tracking-widest uppercase">Waiting for next hand</div>}
            {roomState.state === 'PLAYING' && <div className="text-2xl text-emerald-900/40 font-black tracking-widest uppercase">Action on {roomState.players[roomState.currentTurnIndex]?.name}</div>}
            {roomState.state === 'SHOWDOWN' && <div className="text-2xl text-amber-900/40 font-black tracking-widest uppercase animate-pulse">Showdown</div>}
          </div>

          {/* Players Ring */}
          <div className="w-full h-full relative z-10 flex flex-wrap justify-center items-center gap-6 p-4">
            {roomState.players.map((p, index) => {
              const isTurn = roomState.state === 'PLAYING' && roomState.currentTurnIndex === index;
              const isDealer = roomState.dealerIndex === index;
              const isMe = p.id === sessionId;

              return (
                <div key={p.id} className={`relative flex flex-col items-center bg-slate-800/80 backdrop-blur rounded-2xl p-4 w-40 transition-all border-2 ${isTurn ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105' : isMe ? 'border-emerald-500/50' : 'border-slate-700/50'}`}>
                  {isDealer && <div className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center font-bold shadow-lg text-xs z-20">D</div>}
                  {p.isHost && <Crown size={16} className="absolute top-3 left-3 text-amber-400 opacity-70" />}
                  
                  <div className="w-12 h-12 bg-slate-700 rounded-full mb-3 flex items-center justify-center border border-slate-600 shadow-inner">
                    <User size={24} className={p.disconnected ? 'text-slate-500' : 'text-slate-300'} />
                  </div>
                  
                  <div className="text-center w-full truncate font-medium text-slate-100">{p.name}</div>
                  <div className="text-emerald-400 font-bold mt-1">${p.chips}</div>
                  
                  {roomState.state === 'PLAYING' && p.currentBet > 0 && (
                    <div className="absolute -bottom-4 bg-amber-500 text-amber-950 font-bold px-3 py-1 rounded-full text-xs shadow-md border border-amber-300 whitespace-nowrap">
                      Bet: ${p.currentBet}
                    </div>
                  )}

                  {p.folded && <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex items-center justify-center font-bold text-red-400 uppercase tracking-widest backdrop-blur-[1px]">Folded</div>}
                  {p.allIn && !p.folded && <div className="absolute inset-0 bg-rose-900/40 rounded-2xl border-rose-500/50 pointer-events-none"></div>}
                  {p.allIn && !p.folded && <div className="absolute top-2 right-2 text-rose-400 text-[10px] font-black uppercase">All-in</div>}
                  {p.disconnected && <div className="absolute -bottom-2 right-2 text-[10px] text-slate-400 bg-slate-800 px-2 rounded-full border border-slate-600">Offline</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bar */}
        {isMyTurn && !me?.allIn && (
          <div className="mt-6 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-4 md:p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex gap-4">
              <button onClick={handleFold} className="bg-rose-900/50 hover:bg-rose-900 text-rose-300 border border-rose-800/50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm">
                Fold
              </button>
              <button onClick={handleCall} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex flex-col items-center justify-center leading-tight">
                <span>{callAmount === 0 ? 'Check' : 'Call'}</span>
                {callAmount > 0 && <span className="text-xs text-emerald-400">${callAmount}</span>}
              </button>
            </div>
            
            <div className="flex-1 flex gap-3 w-full md:w-auto items-center">
              <input 
                type="number" 
                value={betAmount === 0 ? currentHighestBet + minRaise : betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={currentHighestBet + minRaise}
                max={me?.chips + me?.currentBet}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 font-mono text-center md:text-left"
              />
              <button 
                onClick={() => handleRaise(betAmount || currentHighestBet + minRaise)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex flex-col items-center justify-center leading-tight"
              >
                <span>{currentHighestBet === 0 ? 'Bet' : 'Raise'}</span>
              </button>
              <button 
                onClick={handleAllIn}
                className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-rose-900/50 uppercase tracking-wide text-sm"
              >
                All In
              </button>
            </div>
          </div>
        )}
      </div>

      {showAutoAward && <ShowdownModal roomState={roomState} sessionId={sessionId} onClose={() => setShowAutoAward(false)} />}
      {showManualAward && <ManualAwardModal roomState={roomState} sessionId={sessionId} onClose={() => setShowManualAward(false)} />}
    </div>
  );
}
