import { useEffect, useRef, useState } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { confirmEmail } from './api';

export default function ConfirmEmailLanding({ onGoToLogin }) {
  const [error, setError] = useState('');
  const calledRef = useRef(false);
  const onGoToLoginRef = useRef(onGoToLogin);
  useEffect(() => { onGoToLoginRef.current = onGoToLogin; });

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const parts = window.location.pathname.split('/');
    const token = parts[parts.length - 1];
    if (!token) { setError('Missing token.'); return; }

    confirmEmail(token)
      .then(() => {
        window.history.replaceState({}, '', '/');
        onGoToLoginRef.current();
      })
      .catch((err) => {
        setError(err.message || 'This link is invalid or has already been used.');
      });
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
          <img src="/logo.png" alt="Logo" height="48" className="mx-auto mb-3" />
          <h5 className="fw-bold mb-1" style={{ color: '#FF6B00' }}>Complet Cont</h5>
          {!error ? (
            <>
              <Spinner animation="border" style={{ color: '#FF6B00' }} className="mx-auto my-3" />
              <p className="text-muted small mb-0">Confirming your account…</p>
            </>
          ) : (
            <>
              <Alert variant="danger" className="rounded-3 small mt-3">{error}</Alert>
              <Button variant="link" className="p-0 small shadow-none" style={{ color: '#6c757d' }} onClick={onGoToLogin}>
                ← Back to login
              </Button>
            </>
          )}
        </Card>
      </Container>
    </div>
  );
}
