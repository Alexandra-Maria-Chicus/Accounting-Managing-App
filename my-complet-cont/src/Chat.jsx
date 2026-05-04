import { useState, useEffect, useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

function Chat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const room = "general";

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${room}/${encodeURIComponent(currentUser.name)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'history') {
        setMessages(data.messages);
      } else {
        setMessages(prev => [...prev, data]);
      }
    };

    return () => ws.close();
  }, [currentUser.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ message: input.trim() }));
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-4" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
        <span className="fw-bold" style={{ color: '#001529' }}>Team Chat</span>
        <span className={`badge ${connected ? 'bg-success' : 'bg-danger'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </Card.Header>

      <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.type === 'system' ? 'text-center' : ''}`}>
            {msg.type === 'system' ? (
              <small className="text-muted">{msg.message}</small>
            ) : (
              <div className={`d-flex ${msg.sender === currentUser.name ? 'justify-content-end' : 'justify-content-start'}`}>
                <div
                  className="px-3 py-2 rounded-3"
                  style={{
                    maxWidth: '70%',
                    backgroundColor: msg.sender === currentUser.name ? '#FF6B00' : '#fff',
                    color: msg.sender === currentUser.name ? '#fff' : '#1a1a1a',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {msg.sender !== currentUser.name && (
                    <div className="fw-bold small mb-1" style={{ color: '#FF6B00' }}>{msg.sender}</div>
                  )}
                  <div>{msg.message}</div>
                  <div className="small mt-1 opacity-75" style={{ fontSize: '0.65rem' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <Card.Footer className="bg-white border-top p-3">
        <div className="d-flex gap-2">
          <Form.Control
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-light border-0 shadow-none rounded-3"
          />
          <Button
            className="px-4 border-0 fw-bold rounded-3"
            style={{ backgroundColor: '#FF6B00' }}
            onClick={sendMessage}
            disabled={!connected}
          >
            Send
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default Chat;