import { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';
import { fetchUsers } from './api';

const WS_BASE = import.meta.env.VITE_WS_BASE
  || (typeof window !== 'undefined'
      ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
      : 'ws://localhost:8000');

function dmRoom(idA, idB) {
  return `dm_${Math.min(idA, idB)}_${Math.max(idA, idB)}`;
}

function DMConversation({ currentUser, peer, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const room = dmRoom(currentUser.id, peer.id);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/chat/${room}/${encodeURIComponent(currentUser.name)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'history') setMessages(data.messages);
      else if (data.type === 'message') setMessages(prev => [...prev, data]);
    };
    return () => ws.close();
  }, [room, currentUser.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ message: input.trim() }));
    setInput('');
  };

  return (
    <>
      <Card.Header className="bg-white border-bottom d-flex align-items-center gap-2 py-2 px-3">
        <Button variant="link" className="p-0 text-muted shadow-none" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Button>
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=FF6B00&color=fff&size=32`}
          alt="" width="28" height="28" className="rounded-circle"
        />
        <span className="fw-bold small" style={{ color: '#001529' }}>{peer.name}</span>
        <span className={`ms-auto badge ${connected ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.6rem' }}>
          {connected ? 'online' : 'offline'}
        </span>
      </Card.Header>

      <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
        {messages.length === 0 && (
          <div className="text-center text-muted small pt-4">Start a conversation with {peer.name}</div>
        )}
        {messages.map((msg, i) => {
          const mine = msg.sender === currentUser.name;
          if (msg.type === 'system') return (
            <div key={i} className="text-center my-2"><small className="text-muted">{msg.message}</small></div>
          );
          return (
            <div key={i} className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className="px-3 py-2 rounded-3" style={{
                maxWidth: '72%',
                backgroundColor: mine ? '#FF6B00' : '#fff',
                color: mine ? '#fff' : '#1a1a1a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: '0.875rem' }}>{msg.message}</div>
                <div className="mt-1 opacity-60" style={{ fontSize: '0.62rem', textAlign: mine ? 'right' : 'left' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Card.Footer className="bg-white border-top p-2">
        <div className="d-flex gap-2">
          <Form.Control
            placeholder="Message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            className="bg-light border-0 shadow-none rounded-3"
            style={{ fontSize: '0.875rem' }}
          />
          <Button
            onClick={send}
            disabled={!connected}
            className="px-3 border-0 rounded-3 fw-bold"
            style={{ backgroundColor: '#FF6B00', fontSize: '0.875rem' }}
          >
            Send
          </Button>
        </div>
      </Card.Footer>
    </>
  );
}

function Chat({ currentUser, onClose }) {
  const [allPeers, setAllPeers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedPeer, setSelectedPeer] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(users => setAllPeers(users.filter(u => u.id !== currentUser.id)))
      .catch(() => {});
  }, [currentUser.id]);

  const results = query.trim().length > 0
    ? allPeers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <Card className="border-0 shadow rounded-4 overflow-hidden" style={{ width: '340px', height: '480px', display: 'flex', flexDirection: 'column' }}>
      {selectedPeer ? (
        <DMConversation
          currentUser={currentUser}
          peer={selectedPeer}
          onBack={() => setSelectedPeer(null)}
        />
      ) : (
        <>
          <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-2 px-3">
            <span className="fw-bold small" style={{ color: '#001529' }}>Messages</span>
            <Button variant="link" className="p-0 text-muted shadow-none" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </Button>
          </Card.Header>

          <div className="px-3 pt-3 pb-2 bg-white border-bottom">
            <div className="d-flex align-items-center gap-2 px-2 rounded-3" style={{ background: '#f1f5f9' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="border-0 bg-transparent py-2 w-100"
                style={{ outline: 'none', fontSize: '0.875rem', color: '#1a1a1a' }}
                placeholder="Search people…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="border-0 bg-transparent p-0 text-muted" style={{ lineHeight: 1 }} onClick={() => setQuery('')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto">
            {query.trim().length === 0 && (
              <div className="text-center text-muted small p-4 pt-5" style={{ color: '#94a3b8' }}>
                Search for a team member to start a conversation.
              </div>
            )}
            {query.trim().length > 0 && results.length === 0 && (
              <div className="text-center text-muted small p-4 pt-5">No results for "{query}"</div>
            )}
            {results.map(peer => (
              <button
                key={peer.id}
                onClick={() => { setSelectedPeer(peer); setQuery(''); }}
                className="w-100 d-flex align-items-center gap-3 px-3 py-2 border-0 bg-transparent text-start"
                style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=FF6B00&color=fff&size=40`}
                  alt="" width="38" height="38" className="rounded-circle flex-shrink-0"
                />
                <div>
                  <div className="fw-bold small" style={{ color: '#1a1a1a' }}>{peer.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>{peer.role}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default Chat;
