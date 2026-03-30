import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

function RegisterPage({ onGoToLogin, onRegister }) {
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) {
      e.name = 'Full name is required.';
    } else if (fields.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }
    if (!fields.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!fields.password) {
      e.password = 'Password is required.';
    } else if (fields.password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    }
    if (!fields.confirm) {
      e.confirm = 'Please confirm your password.';
    } else if (fields.confirm !== fields.password) {
      e.confirm = 'Passwords do not match.';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onRegister({ email: fields.email, password: fields.password, name: fields.name });
    setSuccess(true);
    setTimeout(() => onGoToLogin(), 2000);
  };

  return (
    <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>

        <div className="text-center mb-4">
          <img src="logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
          <div className="text-muted small">Create your account</div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          {success && (
            <Alert variant="success" className="rounded-3 py-2 small mb-3">
              Account created successfully! Redirecting to login...
            </Alert>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Maria Chicus"
                value={fields.name}
                onChange={set('name')}
                isInvalid={!!errors.name}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@completcont.ro"
                value={fields.email}
                onChange={set('email')}
                isInvalid={!!errors.email}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Min. 6 characters"
                value={fields.password}
                onChange={set('password')}
                isInvalid={!!errors.password}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase">Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Repeat password"
                value={fields.confirm}
                onChange={set('confirm')}
                isInvalid={!!errors.confirm}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.confirm}</Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              className="w-100 py-2 fw-bold border-0 rounded-3"
              style={{ backgroundColor: '#FF6B00' }}
              disabled={success}
            >
              Create Account
            </Button>
          </Form>

          <div className="text-center mt-4 small text-muted">
            Already have an account?{' '}
            <Button variant="link" className="p-0 shadow-none small fw-bold"
              style={{ color: '#FF6B00', textDecoration: 'none' }}
              onClick={onGoToLogin}>
              Sign In
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  );
}

export default RegisterPage;
