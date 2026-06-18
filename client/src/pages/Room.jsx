import { useState, useMemo } from 'react';
import { socket } from '../utils/socket';
import { Crown, Play, Trophy, HandCoins, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Topbar */}
      <motion.div 
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-20"
      >
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2 tracking-tight">Pokler</h2>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Room Code</span>
            <span className="bg-slate-950 px-3 py-1 rounded-md font-mono font-bold tracking-widest text-emerald-400 border border-slate-800 shadow-inner">{roomState.code}</span>
          </div>

          <motion.div 
            layout
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="text-sm text-slate-400 font-medium mb-1 tracking-wide uppercase">Total Pot</div>
            <motion.div 
              key={totalPot}
              initial={{ scale: 1.2, color: '#fcd34d' }}
              animate={{ scale: 1, color: '#fbbf24' }}
              className="text-5xl font-black text-amber-400 drop-shadow-sm"
            >
              ${totalPot}
            </motion.div>
            
            <AnimatePresence>
              {roomState.pots.length > 1 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-slate-700/50 space-y-2"
                >
                  {roomState.pots.map((pot, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/40 px-3 py-2 rounded-lg">
                      <span className="text-xs font-semibold text-slate-400 tracking-wider">POT {idx+1}</span>
                      <span className="text-sm font-bold text-amber-500/90">${pot.amount}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {isHost && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
          >
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2 mb-4"><Crown size={14} className="text-amber-400"/> Host Controls</h3>
            {roomState.state === 'WAITING' && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartHand}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
              >
                <Play size={18} /> Start Hand
              </motion.button>
            )}
            {(roomState.state === 'SHOWDOWN' || roomState.state === 'WAITING') && totalPot > 0 && (
              <div className="flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAutoAward(true)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl flex justify-center items-center gap-2 shadow-md transition-colors"
                  title="Auto Evaluate"
                >
                  <Trophy size={18} /> Auto
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowManualAward(true)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl flex justify-center items-center gap-2 shadow-md transition-colors"
                  title="Manual Award"
                >
                  <HandCoins size={18} /> Manual
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Main Table Area */}
      <div className="flex-1 p-4 md:p-8 flex flex-col relative z-10">
        <div className="flex-1 rounded-[3rem] border border-slate-800/60 p-6 flex flex-col justify-center items-center relative shadow-2xl">
          {/* Animated Table Background */}
          <div className="absolute inset-4 md:inset-12 border-[12px] border-slate-800 rounded-[5rem] md:rounded-[10rem] bg-gradient-to-br from-emerald-900/40 to-teal-950/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
            <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent"></div>
            
            {/* Center Logo/Status */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={roomState.state}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {roomState.state === 'WAITING' && <div className="text-xl md:text-3xl text-emerald-500/20 font-black tracking-[0.3em] uppercase">Waiting</div>}
                {roomState.state === 'PLAYING' && <div className="text-xl md:text-2xl text-emerald-500/30 font-black tracking-widest uppercase">Action on <span className="text-emerald-400/50">{roomState.players[roomState.currentTurnIndex]?.name}</span></div>}
                {roomState.state === 'SHOWDOWN' && <div className="text-xl md:text-4xl text-amber-500/40 font-black tracking-[0.2em] uppercase">Showdown</div>}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Players Ring */}
          <div className="w-full h-full relative z-20 flex flex-wrap justify-center items-center gap-8 md:gap-12 p-8">
            <AnimatePresence>
              {roomState.players.map((p, index) => {
                const isTurn = roomState.state === 'PLAYING' && roomState.currentTurnIndex === index;
                const isDealer = roomState.dealerIndex === index;
                const isMe = p.id === sessionId;

                return (
                  <motion.div 
                    key={p.id} 
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ 
                      opacity: p.disconnected ? 0.6 : 1, 
                      scale: isTurn ? 1.05 : 1, 
                      y: 0,
                      boxShadow: isTurn ? '0 0 30px rgba(251,191,36,0.2)' : '0 10px 25px rgba(0,0,0,0.5)'
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className={`relative flex flex-col items-center bg-gradient-to-b from-slate-800 to-slate-900 backdrop-blur-xl rounded-3xl p-5 w-44 transition-colors border-2 ${isTurn ? 'border-amber-400' : isMe ? 'border-emerald-500/50' : 'border-slate-700/50'}`}
                  >
                    {isDealer && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-4 -right-4 w-9 h-9 bg-gradient-to-br from-white to-slate-200 text-slate-900 rounded-full flex items-center justify-center font-black shadow-[0_4px_10px_rgba(0,0,0,0.3)] text-sm z-30 border-2 border-slate-800"
                      >
                        D
                      </motion.div>
                    )}
                    {p.isHost && <Crown size={18} className="absolute top-4 left-4 text-amber-400/80 drop-shadow-md" />}
                    
                    <div className={`w-16 h-16 rounded-full mb-3 flex items-center justify-center shadow-inner border-2 ${isTurn ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950 border-slate-700/50'}`}>
                      <User size={30} className={p.disconnected ? 'text-slate-600' : isTurn ? 'text-amber-400' : 'text-slate-400'} />
                    </div>
                    
                    <div className="text-center w-full truncate font-bold text-slate-100 text-lg">{p.name}</div>
                    <div className="text-emerald-400 font-black tracking-wide mt-1">${p.chips}</div>
                    
                    <AnimatePresence>
                      {roomState.state === 'PLAYING' && p.currentBet > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.8 }}
                          className="absolute -bottom-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-black px-4 py-1.5 rounded-full text-sm shadow-[0_5px_15px_rgba(251,191,36,0.3)] border-2 border-amber-300 whitespace-nowrap z-30"
                        >
                          ${p.currentBet}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {p.folded && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-950/80 rounded-3xl flex items-center justify-center font-black text-rose-500 uppercase tracking-[0.2em] backdrop-blur-[2px] z-20 border border-rose-900/50"
                      >
                        Folded
                      </motion.div>
                    )}
                    
                    {p.allIn && !p.folded && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-0 right-0 left-0 flex justify-center -mt-3 z-30 pointer-events-none"
                      >
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-sm shadow-sm tracking-widest border border-rose-400/50">All-in</span>
                      </motion.div>
                    )}
                    {p.allIn && !p.folded && <div className="absolute inset-0 bg-rose-900/20 rounded-3xl border border-rose-500/30 pointer-events-none z-10"></div>}
                    
                    {p.disconnected && (
                      <div className="absolute -bottom-3 right-0 left-0 flex justify-center z-30">
                        <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-3 py-0.5 rounded-full border border-slate-600 shadow-md">Offline</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Bar */}
        <AnimatePresence>
          {isMyTurn && !me?.allIn && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="mt-6 bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/80 p-5 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-4 items-center justify-between z-30 relative"
            >
              <div className="flex gap-3 w-full md:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFold} 
                  className="flex-1 md:flex-none bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/50 px-8 py-4 rounded-2xl font-bold transition-colors shadow-sm"
                >
                  Fold
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCall} 
                  className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-slate-100 px-10 py-4 rounded-2xl font-bold transition-colors shadow-sm flex flex-col items-center justify-center leading-tight"
                >
                  <span className="text-lg">{callAmount === 0 ? 'Check' : 'Call'}</span>
                  {callAmount > 0 && <span className="text-xs text-emerald-400 mt-0.5">${callAmount}</span>}
                </motion.button>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto items-stretch">
                <div className="relative flex-1 md:w-48">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={betAmount === 0 ? currentHighestBet + minRaise : betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min={currentHighestBet + minRaise}
                    max={me?.chips + me?.currentBet}
                    className="w-full h-full bg-slate-900 border-2 border-slate-700/80 rounded-2xl pl-8 pr-4 text-slate-100 outline-none focus:border-emerald-500 font-mono font-bold text-lg transition-colors"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRaise(betAmount || currentHighestBet + minRaise)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-2xl font-bold transition-colors shadow-lg flex flex-col items-center justify-center"
                >
                  <span className="text-lg">{currentHighestBet === 0 ? 'Bet' : 'Raise'}</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAllIn}
                  className="bg-gradient-to-br from-rose-600 to-red-700 text-white px-6 rounded-2xl font-black shadow-lg uppercase tracking-wider text-sm flex items-center justify-center"
                >
                  All In
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAutoAward && <ShowdownModal roomState={roomState} sessionId={sessionId} onClose={() => setShowAutoAward(false)} />}
      {showManualAward && <ManualAwardModal roomState={roomState} sessionId={sessionId} onClose={() => setShowManualAward(false)} />}
    </div>
  );
}
