import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { registerUser } from './api';

export default function RegisterPage({ onGoToLogin, onLoginSuccess }) {
  const [role,      setRole]      = useState('employee');
  const [fields,    setFields]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [staffCode, setStaffCode] = useState('');
  const [firmCode,  setFirmCode]  = useState('');
  const [errors,    setErrors]    = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading,   setLoading]   = useState(false);

  const setField = (key) => (e) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setServerErr('');
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim())                e.name     = 'Full name is required.';
    else if (fields.name.trim().length < 2) e.name     = 'Name must be at least 2 characters.';
    if (!fields.email.trim())               e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'Enter a valid email address.';
    if (!fields.password)                   e.password = 'Password is required.';
    else if (fields.password.length < 6)    e.password = 'Password must be at least 6 characters.';
    if (!fields.confirm)                    e.confirm  = 'Please confirm your password.';
    else if (fields.confirm !== fields.password) e.confirm = 'Passwords do not match.';
    if (role === 'employee' && !staffCode.trim()) e.staffCode = 'Staff code is required.';
    if (role === 'client'   && !firmCode.trim())  e.firmCode  = 'Firm code is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await registerUser({
        name:      fields.name,
        email:     fields.email,
        password:  fields.password,
        role,
        staffCode: role === 'employee' ? staffCode : null,
        firmCode:  role === 'client'   ? firmCode  : null,
      });
      onLoginSuccess(user);
    } catch (err) {
      if (err.status === 409) setErrors({ email: 'This email is already registered.' });
      else if (err.status === 403) setErrors({ staffCode: 'Invalid staff code.' });
      else if (err.status === 404) setErrors({ firmCode: 'No company found with that code. Check the code your accountant gave you.' });
      else setServerErr(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '480px' }}>

        <div className="text-center mb-4">
          <img src="logo.png" alt="Logo" height="64" className="mb-2" />
          <div className="fw-bold fs-4" style={{ color: '#FF6B00' }}>Complet Cont</div>
          <div className="text-muted small">Create your account</div>
        </div>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          {serverErr && <Alert variant="danger" className="rounded-3 py-2 small mb-3">{serverErr}</Alert>}

          <Form noValidate onSubmit={handleSubmit}>

            {/* Account type */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase">Account type</Form.Label>
              <div className="d-flex gap-2 mt-1">
                {[
                  { value: 'employee', label: '👔 Employee' },
                  { value: 'client',   label: '🏢 Client'   },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setRole(opt.value); setErrors({}); setServerErr(''); }}
                    className="flex-fill py-2 rounded-3 border fw-bold small"
                    style={{
                      backgroundColor: role === opt.value ? '#FF6B00' : '#f8f9fa',
                      color:           role === opt.value ? '#fff'     : '#6c757d',
                      borderColor:     role === opt.value ? '#FF6B00'  : '#dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                {role === 'employee'
                  ? 'For accounting staff. You will need the staff access code.'
                  : 'For company clients. You will need the code your accountant gave you.'}
              </div>
            </Form.Group>

            {/* Staff code — employee only */}
            {role === 'employee' && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Staff access code</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter the staff code"
                  value={staffCode}
                  onChange={(e) => { setStaffCode(e.target.value); setErrors(prev => ({ ...prev, staffCode: '' })); }}
                  isInvalid={!!errors.staffCode}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                />
                <Form.Control.Feedback type="invalid">{errors.staffCode}</Form.Control.Feedback>
                <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                  Provided by management. Contact your administrator if you don't have it.
                </div>
              </Form.Group>
            )}

            {/* Firm code — client only */}
            {role === 'client' && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Firm registration code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. ACME-2026"
                  value={firmCode}
                  onChange={(e) => { setFirmCode(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, firmCode: '' })); }}
                  isInvalid={!!errors.firmCode}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
                <Form.Control.Feedback type="invalid">{errors.firmCode}</Form.Control.Feedback>
                <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                  Your accountant provided this code privately. It links your account to your company.
                </div>
              </Form.Group>
            )}

            {/* Name */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Full name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Maria Chicus"
                value={fields.name}
                onChange={setField('name')}
                isInvalid={!!errors.name}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>

            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={fields.email}
                onChange={setField('email')}
                isInvalid={!!errors.email}
                className="bg-light border-0 shadow-none py-2 rounded-3"
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            {/* Password */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Min. 6 characters"
                    value={fields.password}
                    onChange={setField('password')}
                    isInvalid={!!errors.password}
                    className="bg-light border-0 shadow-none py-2 rounded-3"
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Confirm</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Repeat password"
                    value={fields.confirm}
                    onChange={setField('confirm')}
                    isInvalid={!!errors.confirm}
                    className="bg-light border-0 shadow-none py-2 rounded-3"
                  />
                  <Form.Control.Feedback type="invalid">{errors.confirm}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Button
              type="submit"
              className="w-100 py-2 fw-bold border-0 rounded-3"
              style={{ backgroundColor: '#FF6B00' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
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
