import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { resetPassword } from './api';

export default function ResetPassword({ onGoToLogin }) {
  const [token,    setToken]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [invalid,  setInvalid]  = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const t = parts[parts.length - 1];
    if (!t || t === 'reset-password') {
      setInvalid(true);
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!password)                errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (confirm !== password)     errs.confirm  = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.message || 'This link is invalid or has expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <Container style={{ maxWidth: '440px' }}>
          <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
            <p className="text-danger fw-bold mb-3">Invalid reset link.</p>
            <Button variant="link" style={{ color: '#FF6B00' }} onClick={onGoToLogin}>← Back to login</Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <img src="logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
          <div className="text-muted small">Set a new password</div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          {success ? (
            <div className="text-center">
              <Alert variant="success" className="rounded-3">Password updated! You can now sign in.</Alert>
              <Button className="border-0 rounded-3 px-4 fw-bold" style={{ backgroundColor: '#FF6B00' }} onClick={onGoToLogin}>
                Go to Login
              </Button>
            </div>
          ) : (
            <Form noValidate onSubmit={handleSubmit}>
              {errors.general && <Alert variant="danger" className="rounded-3 py-2 small">{errors.general}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  isInvalid={!!errors.password}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                  isInvalid={!!errors.confirm}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                />
                <Form.Control.Feedback type="invalid">{errors.confirm}</Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="w-100 py-2 fw-bold border-0 rounded-3"
                style={{ backgroundColor: '#FF6B00' }} disabled={loading}>
                {loading ? 'Saving…' : 'Set New Password'}
              </Button>

              <div className="text-center mt-3">
                <Button variant="link" className="p-0 shadow-none small text-muted" onClick={onGoToLogin}>
                  ← Back to login
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </Container>
    </div>
  );
}
