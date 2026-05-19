import { useEffect, useState } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { validate2FALink, storeUser } from './api';

export default function LinkVerifyLanding({ onLoginSuccess, onGoToLogin }) {
  const [error, setError] = useState('');

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const token = parts[parts.length - 1];
    
    if (!token) {
      setError('Missing tracking signature code token.');
      return;
    }

    validate2FALink(token)
      .then((user) => {
        storeUser(user);
        onLoginSuccess(user);
      })
      .catch((err) => {
        setError(err.message || 'This validation link is invalid or has expired.');
      });
  }, [onLoginSuccess]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
          {!error ? (
            <>
              <Spinner animation="border" style={{ color: '#FF6B00' }} className="mx-auto mb-3" />
              <p className="text-muted mb-0">Confirming security authorization...</p>
            </>
          ) : (
            <>
              <Alert variant="danger" className="rounded-3 small">{error}</Alert>
              <Button variant="link" style={{ color: '#FF6B00' }} onClick={onGoToLogin}>← Back to login</Button>
            </>
          )}
        </Card>
      </Container>
    </div>
  );
}