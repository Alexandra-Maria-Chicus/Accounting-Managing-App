import { useState, useEffect, useRef } from 'react';
import { Card, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { validateCompany } from './companiesLogic';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function CompanyForm({ initial, allCompanies, editingId, onSave, onClose, title }) {
  const [fields, setFields] = useState(
    initial || { name: '', email: '', phone: '', address: '', contactName: '', contactEmail: '', registrationCode: '' }
  );
  const [errors, setErrors] = useState({});
  const [codeStatus, setCodeStatus] = useState('idle');
  const timerRef = useRef(null);
  const originalCode = (initial?.registrationCode || '').trim().toUpperCase();

  useEffect(() => {
    const code = (fields.registrationCode || '').trim().toUpperCase();
    if (!code || code === originalCode) { setCodeStatus('idle'); return; }
    if (code.length < 4) { setCodeStatus('idle'); return; }
    setCodeStatus('checking');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/auth/check-code?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        setCodeStatus(data.taken ? 'taken' : 'available');
      } catch { setCodeStatus('idle'); }
    }, 450);
    return () => clearTimeout(timerRef.current);
  }, [fields.registrationCode]);

  const set = (key) => (e) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateCompany(fields, allCompanies, editingId);
    const code = (fields.registrationCode || '').trim();
    if (code.length > 0 && code.length < 4) validationErrors.registrationCode = 'Code must be at least 4 characters.';
    if (codeStatus === 'taken') validationErrors.registrationCode = 'This code is already in use.';
    if (codeStatus === 'checking') validationErrors.registrationCode = 'Still checking availability…';
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(fields);
  };

  const codeIndicator = () => {
    if (codeStatus === 'checking')  return <span className="ms-2 small text-muted"><Spinner size="sm" /> Checking…</span>;
    if (codeStatus === 'taken')     return <span className="ms-2 small text-danger fw-bold">Already in use</span>;
    if (codeStatus === 'available') return <span className="ms-2 small text-success fw-bold">Available</span>;
    return null;
  };

  return (
    <Card className="border-0 shadow-sm p-5 rounded-4 bg-white page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0" style={{ color: '#001529' }}>{title}</h4>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          Back to Companies
        </Button>
      </div>

      <Form noValidate onSubmit={handleSubmit}>
        <Row>
          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Company Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Acme Corporation"
              value={fields.name}
              onChange={set('name')}
              isInvalid={!!errors.name}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="info@company.com"
              value={fields.email}
              onChange={set('email')}
              isInvalid={!!errors.email}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="+40 722 100 200"
              value={fields.phone}
              onChange={set('phone')}
              isInvalid={!!errors.phone}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Str. Memorandumului, Cluj-Napoca"
              value={fields.address}
              onChange={set('address')}
              isInvalid={!!errors.address}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase d-flex align-items-center">
              Client Registration Code
              {codeIndicator()}
            </Form.Label>
            <Form.Control
              type="text"
              value={fields.registrationCode || ''}
              onChange={e => { setFields(prev => ({ ...prev, registrationCode: e.target.value.toUpperCase() })); setErrors(prev => ({ ...prev, registrationCode: '' })); }}
              isInvalid={!!errors.registrationCode || codeStatus === 'taken'}
              isValid={codeStatus === 'available'}
              className="bg-light border-0 shadow-none py-2 rounded-3"
              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />
            <Form.Control.Feedback type="invalid">{errors.registrationCode}</Form.Control.Feedback>
            <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
              Clients will enter this code to link their account. Must be unique across all firms. Leave blank to set later.
            </div>
          </Col>
        </Row>

        <hr className="my-3" />
        <p className="small fw-bold text-muted text-uppercase mb-3">Primary Contact Person</p>

        <Row>
          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Contact Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="John Doe"
              value={fields.contactName}
              onChange={set('contactName')}
              isInvalid={!!errors.contactName}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.contactName}</Form.Control.Feedback>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Contact Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="john@company.com"
              value={fields.contactEmail}
              onChange={set('contactEmail')}
              isInvalid={!!errors.contactEmail}
              className="bg-light border-0 shadow-none py-2 rounded-3"
            />
            <Form.Control.Feedback type="invalid">{errors.contactEmail}</Form.Control.Feedback>
          </Col>
        </Row>

        <div className="mt-4 d-flex gap-2">
          <Button
            type="submit"
            className="px-5 border-0 fw-bold rounded-3"
            style={{ backgroundColor: '#FF6B00' }}
          >
            {editingId ? 'Save Changes' : 'Add Company'}
          </Button>
          <Button variant="light" className="px-4 fw-bold rounded-3" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default CompanyForm;
