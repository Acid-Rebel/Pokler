import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import { socket } from './utils/socket';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [roomState, setRoomState] = useState(null);

  useEffect(() => {
    let sid = localStorage.getItem('pokler_session');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pokler_session', sid);
    }
    setSessionId(sid);

    socket.on('roomState', (state) => {
      setRoomState(state);
    });

    return () => {
      socket.off('roomState');
    };
  }, []);

  if (!roomState) {
    return <Home sessionId={sessionId} />;
  }

  return <Room sessionId={sessionId} roomState={roomState} />;
}

export default App;
