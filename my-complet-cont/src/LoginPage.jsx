import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { loginUser, requestPasswordReset, requestMagicLink } from './api';

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [subView, setSubView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const reset = (view) => {
    setSubView(view);
    setErrors({});
    setAuthError('');
    setSuccess('');
    setLoading(false);
  };

  const handleCancelLinkView = () => {
    setLinkSent(false);
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    if (!password)     errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.requires_2fa || response.requires_link_confirmation) {
        setLinkSent(true);
      } else {
        onLoginSuccess(response);
      }
    } catch (err) {
      setAuthError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErrors({ email: 'Email is required.' }); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } finally {
      setSuccess('If that email is registered, you will receive a reset link shortly. Check your inbox.');
      setLoading(false);
    }
  };

  const handleMagic = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErrors({ email: 'Email is required.' }); return; }
    setLoading(true);
    try {
      await requestMagicLink(email);
    } finally {
      setSuccess('Login link sent! Check your email and click the link to sign in.');
      setLoading(false);
    }
  };

  const handleSubmit = subView === 'login' ? handleLogin : subView === 'forgot' ? handleForgot : handleMagic;

  // Render pure check email notification screen layout
  if (linkSent) {
    return (
      <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
        <Container style={{ maxWidth: '440px' }}>
          <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
            <img src="/logo.png" alt="Logo" height="64" className="mx-auto mb-3" />
            <h4 className="fw-bold mb-2">Check Your Email</h4>
            <p className="text-muted small mb-4">
              A verification magic link has been dispatched to <strong>{email}</strong> via Mailtrap. Open your email inbox and click the security link to log in.
            </p>
            <Button variant="link" style={{ color: '#FF6B00' }} onClick={handleCancelLinkView}>
              &larr; Back to Sign In
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>

        <div className="text-center mb-4">
          <img src="/logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
          <div className="text-muted small">
            {subView === 'login'  && 'Sign in to your account'}
            {subView === 'forgot' && 'Reset your password'}
            {subView === 'magic'  && 'Sign in without a password'}
          </div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          {authError && <Alert variant="danger" className="rounded-3 py-2 small mb-3">{authError}</Alert>}
          {success   && <Alert variant="success" className="rounded-3 py-2 small mb-3">{success}</Alert>}

          {!success && (
            <Form noValidate onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  isInvalid={!!errors.email}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              {subView === 'login' && (
                <Form.Group className="mb-1">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
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
              )}

              {subView === 'login' && (
                <div className="text-end mb-3">
                  <Button variant="link" className="p-0 shadow-none"
                    style={{ color: '#FF6B00', textDecoration: 'none', fontSize: '0.8rem' }}
                    onClick={() => reset('forgot')}>
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-100 py-2 fw-bold border-0 rounded-3 mb-2"
                style={{ backgroundColor: '#FF6B00' }}
                disabled={loading}
              >
                {loading ? 'Please wait...' : (
                  subView === 'login'  ? 'Sign In' :
                  subView === 'forgot' ? 'Send Reset Link' :
                  'Send Login Link'
                )}
              </Button>

              {subView === 'login' && (
                <Button type="button" variant="light" className="w-100 py-2 fw-bold rounded-3 text-muted"
                  style={{ fontSize: '0.85rem' }} onClick={() => reset('magic')}>
                  ✉ Sign in with email link
                </Button>
              )}
            </Form>
          )}

          {subView !== 'login' && (
            <div className="text-center mt-3">
              <Button variant="link" className="p-0 shadow-none small text-muted" onClick={() => reset('login')}>
                &larr; Back to login
              </Button>
            </div>
          )}

          {subView === 'login' && (
            <div className="text-center mt-4 small text-muted">
              Don't have an account?{' '}
              <Button variant="link" className="p-0 shadow-none small fw-bold"
                style={{ color: '#FF6B00', textDecoration: 'none' }}
                onClick={onGoToRegister}>
                Register
              </Button>
            </div>
          )}
        </Card>

      </Container>
    </div>
  );
}