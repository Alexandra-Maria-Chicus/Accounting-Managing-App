import { useState } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { confirmEmail, storeUser } from './api';

export default function ConfirmEmailLanding({ onLoginSuccess, onGoToLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleConfirm = async () => {
    const parts = window.location.pathname.split('/');
    const token = parts[parts.length - 1];
    if (!token) { setError('Missing token.'); return; }

    setLoading(true);
    setError('');
    try {
      const user = await confirmEmail(token);
      storeUser(user);
      window.history.replaceState({}, '', '/');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'This link is invalid or has already been used.');
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
          <img src="/logo.png" alt="Logo" height="48" className="mx-auto mb-3" />
          <h5 className="fw-bold mb-1" style={{ color: '#FF6B00' }}>Confirm your account</h5>
          <p className="text-muted small mb-4">Click below to activate your Complet Cont account.</p>
          {error && <Alert variant="danger" className="rounded-3 small mb-3">{error}</Alert>}
          {!error && (
            <Button
              className="w-100 py-2 fw-bold border-0 rounded-3 mb-3"
              style={{ backgroundColor: '#FF6B00' }}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Confirm My Account'}
            </Button>
          )}
          <Button variant="link" className="p-0 small shadow-none" style={{ color: '#6c757d' }} onClick={onGoToLogin}>
            ← Back to login
          </Button>
        </Card>
      </Container>
    </div>
  );
}
