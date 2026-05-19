import { useEffect, useState } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { validateMagicLink, storeUser } from './api';

export default function MagicLogin({ onLoginSuccess, onGoToLogin }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [error,  setError]  = useState('');

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const token = parts[parts.length - 1];
    if (!token || token === 'magic') {
      setError('Invalid magic link.');
      setStatus('error');
      return;
    }

    validateMagicLink(token)
      .then((user) => {
        storeUser(user);
        onLoginSuccess(user);
      })
      .catch((err) => {
        setError(err.message || 'This link is invalid or has already been used.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <img src="logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
          {status === 'loading' && (
            <>
              <Spinner animation="border" style={{ color: '#FF6B00' }} className="mx-auto mb-3" />
              <p className="text-muted mb-0">Signing you in…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <Alert variant="danger" className="rounded-3">{error}</Alert>
              <Button variant="link" style={{ color: '#FF6B00' }} onClick={onGoToLogin}>← Back to login</Button>
            </>
          )}
        </Card>
      </Container>
    </div>
  );
}
