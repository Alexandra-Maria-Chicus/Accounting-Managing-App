import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

const HARDCODED_EMAIL = 'admin@completcont.ro';
const HARDCODED_PASSWORD = 'admin123';

function LoginPage({ onLoginSuccess, onGoToRegister, registeredUsers = [] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    // Simulate a small delay for UX
    setTimeout(() => {
      const isAdmin = email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD;
      const isRegistered = registeredUsers.some(u => u.email === email && u.password === password);
      if (isAdmin || isRegistered) {
        onLoginSuccess();
      } else {
        setAuthError('Incorrect email or password. Please try again.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>

        {/* Logo + brand */}
        <div className="text-center mb-4">
          <img src="logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
          <div className="text-muted small">Sign in to your account</div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          {authError && (
            <Alert variant="danger" className="rounded-3 py-2 small mb-3">
              {authError}
            </Alert>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="admin@completcont.ro"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                isInvalid={!!errors.email}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                isInvalid={!!errors.password}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              className="w-100 py-2 fw-bold border-0 rounded-3"
              style={{ backgroundColor: '#FF6B00' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <div className="text-center mt-4 small text-muted">
            Don't have an account?{' '}
            <Button variant="link" className="p-0 shadow-none small fw-bold"
              style={{ color: '#FF6B00', textDecoration: 'none' }}
              onClick={onGoToRegister}>
              Register
            </Button>
          </div>
        </Card>

        <div className="text-center mt-3 small text-muted">
          <span className="me-1">Demo credentials:</span>
          <code style={{ color: '#FF6B00' }}>admin@completcont.ro</code>
          <span className="mx-1">/</span>
          <code style={{ color: '#FF6B00' }}>admin123</code>
        </div>
      </Container>
    </div>
  );
}

export default LoginPage;
