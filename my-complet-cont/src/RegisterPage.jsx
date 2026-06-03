import { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { registerUser } from './api';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function useCodeCheck(code, enabled) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'taken' | 'available'
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !code || code.trim().length < 4) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/auth/check-code?code=${encodeURIComponent(code.trim())}`);
        const data = await res.json();
        setStatus(data.taken ? 'taken' : 'available');
      } catch {
        setStatus('idle');
      }
    }, 450);
    return () => clearTimeout(timerRef.current);
  }, [code, enabled]);

  return status;
}

export default function RegisterPage({ onGoToLogin, onLoginSuccess }) {
  const [role,      setRole]      = useState('employee');
  const [fields,    setFields]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [staffCode, setStaffCode] = useState('STAFF-2026');
  const [firmCode,  setFirmCode]  = useState('');
  const [orgName,   setOrgName]   = useState('');
  const [errors,    setErrors]    = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Real-time uniqueness checks (only for codes that must be globally unique)
  const staffCodeCheck = useCodeCheck(staffCode, role === 'admin');

  const setField = (key) => (e) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setServerErr('');
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim())              e.name     = 'Full name is required.';
    else if (fields.name.trim().length < 2) e.name   = 'Name must be at least 2 characters.';
    if (!fields.email.trim())             e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = 'Enter a valid email address.';
    if (!fields.password)                 e.password = 'Password is required.';
    else if (fields.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!fields.confirm)                  e.confirm  = 'Please confirm your password.';
    else if (fields.confirm !== fields.password) e.confirm = 'Passwords do not match.';

    if (role === 'admin') {
      if (!orgName.trim())    e.orgName   = 'Organisation name is required.';
      if (!staffCode.trim())  e.staffCode = 'Staff code is required.';
      else if (staffCode.trim().length < 4) e.staffCode = 'Staff code must be at least 4 characters.';
      else if (staffCodeCheck === 'taken')  e.staffCode = 'This code is already in use. Choose a different one.';
      else if (staffCodeCheck === 'checking') e.staffCode = 'Still checking availability…';
    }
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
      await registerUser({
        name:      fields.name,
        email:     fields.email,
        password:  fields.password,
        role,
        orgName:   role === 'admin'  ? orgName   : null,
        staffCode: role !== 'client' ? staffCode : null,
        firmCode:  role === 'client' ? firmCode  : null,
      });
      setConfirmed(true);
    } catch (err) {
      if (err.status === 409 && err.message?.toLowerCase().includes('email'))
        setErrors({ email: 'This email is already registered.' });
      else if (err.status === 409)
        setErrors({ staffCode: 'This code is already in use. Choose a different one.' });
      else if (err.status === 403 && role === 'employee')
        setErrors({ staffCode: 'Invalid staff code. Check with your administrator.' });
      else if (err.status === 404)
        setErrors({ firmCode: 'No company found with that code. Check the code your accountant gave you.' });
      else setServerErr(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'admin',    label: 'Admin'    },
    { value: 'employee', label: 'Employee' },
    { value: 'client',   label: 'Client'   },
  ];

  const roleDescriptions = {
    admin:    'Create a new accounting firm. You will need the admin registration code.',
    employee: 'Join an accounting firm as staff. Enter the code your administrator gave you.',
    client:   'Link your company account. Enter the code your accountant gave you.',
  };

  const codeCheckIndicator = (checkStatus) => {
    if (checkStatus === 'checking')  return <span className="ms-2 small text-muted"><Spinner size="sm" /> Checking…</span>;
    if (checkStatus === 'taken')     return <span className="ms-2 small text-danger fw-bold">Already in use</span>;
    if (checkStatus === 'available') return <span className="ms-2 small text-success fw-bold">Available</span>;
    return null;
  };

  if (confirmed) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '440px' }}>
        <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
          <img src="/logo.png" alt="Logo" height="48" className="mx-auto mb-3" />
          <h5 className="fw-bold mb-2" style={{ color: '#FF6B00' }}>Check your email</h5>
          <p className="text-muted small mb-4">
            We sent a confirmation link to <strong>{fields.email}</strong>.
            Click it to activate your account. The link expires in 24 hours.
          </p>
          <Button variant="link" className="p-0 small shadow-none" style={{ color: '#6c757d' }} onClick={onGoToLogin}>
            ← Back to login
          </Button>
        </Card>
      </Container>
    </div>
  );

  return (
    <div className="page-fade-in min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '480px' }}>

        <div className="text-center mb-4">
          <img src="/logo.png" alt="Logo" height="64" className="mb-2" />
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
                {roleOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setRole(opt.value); setErrors({}); setServerErr(''); setStaffCode(''); setFirmCode(''); setOrgName(''); }}
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
                {roleDescriptions[role]}
              </div>
            </Form.Group>

            {/* Admin fields */}
            {role === 'admin' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Organisation name</Form.Label>
                  <Form.Control
                    type="text"
                    value={orgName}
                    onChange={(e) => { setOrgName(e.target.value); setErrors(prev => ({ ...prev, orgName: '' })); }}
                    isInvalid={!!errors.orgName}
                    className="bg-light border-0 shadow-none py-2 rounded-3"
                  />
                  <Form.Control.Feedback type="invalid">{errors.orgName}</Form.Control.Feedback>
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    The name of your accounting firm.
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase d-flex align-items-center">
                    Staff registration code
                    {codeCheckIndicator(staffCodeCheck)}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={staffCode}
                    onChange={(e) => { setStaffCode(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, staffCode: '' })); }}
                    isInvalid={!!errors.staffCode || staffCodeCheck === 'taken'}
                    isValid={staffCodeCheck === 'available' && staffCode.length >= 4}
                    className="bg-light border-0 shadow-none py-2 rounded-3"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.staffCode}</Form.Control.Feedback>
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    Your employees will enter this code when creating their accounts. Must be unique across all firms.
                  </div>
                </Form.Group>
              </>
            )}

            {/* Employee staff code */}
            {role === 'employee' && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Staff code</Form.Label>
                <Form.Control
                  type="password"
                  value={staffCode}
                  onChange={(e) => { setStaffCode(e.target.value); setErrors(prev => ({ ...prev, staffCode: '' })); }}
                  isInvalid={!!errors.staffCode}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                />
                <Form.Control.Feedback type="invalid">{errors.staffCode}</Form.Control.Feedback>
                <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                  Provided by your administrator.
                </div>
              </Form.Group>
            )}

            {/* Client firm code */}
            {role === 'client' && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Firm registration code</Form.Label>
                <Form.Control
                  type="text"
                  value={firmCode}
                  onChange={(e) => { setFirmCode(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, firmCode: '' })); }}
                  isInvalid={!!errors.firmCode}
                  className="bg-light border-0 shadow-none py-2 rounded-3"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
                <Form.Control.Feedback type="invalid">{errors.firmCode}</Form.Control.Feedback>
                <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                  Provided privately by your accountant.
                </div>
              </Form.Group>
            )}

            {/* Name */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Full name</Form.Label>
              <Form.Control
                type="text"
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
              disabled={loading || (role === 'admin' && staffCodeCheck === 'checking')}
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
