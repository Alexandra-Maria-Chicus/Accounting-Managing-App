import { useState } from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function AddEntry({ onClose, onSave, companies = [] }) {
  const now = new Date();
  const [firmName, setFirmName] = useState('');
  const [employee, setEmployee] = useState('Maria Chicus');
  const [acctMonth, setAcctMonth] = useState(now.getMonth());
  const [acctYear, setAcctYear] = useState(now.getFullYear());
  const [errors, setErrors] = useState({});

  const years = [];
  for (let y = 2024; y <= now.getFullYear(); y++) years.push(y);

  const validate = () => {
    const e = {};
    if (!firmName) e.firmName = 'Please select a company.';
    const isFuture = acctYear > now.getFullYear() ||
      (acctYear === now.getFullYear() && acctMonth > now.getMonth());
    if (isFuture) e.acctMonth = 'The accounting month cannot be in the future.';
    return e;
  };

  const handleSaveClick = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(firmName, employee, acctMonth, acctYear, new Date());
  };

  return (
    <Card className="border-0 shadow-sm p-5 rounded-4 bg-white page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0" style={{ color: '#001529' }}>Add New Document</h4>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Back to List</Button>
      </div>

      <Form noValidate>
        <Row>
          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Company</Form.Label>
            <Form.Select
              className="py-2 bg-light border-0 shadow-none"
              value={firmName}
              onChange={(e) => { setFirmName(e.target.value); setErrors(prev => ({ ...prev, firmName: '' })); }}
              isInvalid={!!errors.firmName}
            >
              <option value="">Select a company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.name}>{company.name}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.firmName}</Form.Control.Feedback>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Assigned Employee</Form.Label>
            <Form.Select
              className="py-2 bg-light border-0 shadow-none"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
            >
              <option value="Maria Chicus">Maria Chicus</option>
              <option value="Sarah Johnson">Sarah Johnson</option>
              <option value="Michael Chen">Michael Chen</option>
            </Form.Select>
          </Col>

          <Col md={4} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Accounting Month</Form.Label>
            <Form.Select
              className="py-2 bg-light border-0 shadow-none"
              value={acctMonth}
              onChange={(e) => { setAcctMonth(parseInt(e.target.value)); setErrors(prev => ({ ...prev, acctMonth: '' })); }}
              isInvalid={!!errors.acctMonth}
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.acctMonth}</Form.Control.Feedback>
          </Col>

          <Col md={4} className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Accounting Year</Form.Label>
            <Form.Select
              className="py-2 bg-light border-0 shadow-none"
              value={acctYear}
              onChange={(e) => { setAcctYear(parseInt(e.target.value)); setErrors(prev => ({ ...prev, acctMonth: '' })); }}
              isInvalid={!!errors.acctMonth}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Form.Select>
          </Col>

          <Col md={4} className="mb-3 d-flex align-items-end">
            <div className="bg-light rounded-3 px-3 py-2 w-100 text-muted small">
              <span className="fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.7rem' }}>Date Brought In</span>
              {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (today)
            </div>
          </Col>
        </Row>

        <div className="mt-4 d-flex gap-2">
          <Button
            className="px-5 border-0 fw-bold rounded-3"
            style={{ backgroundColor: '#FF6B00' }}
            onClick={handleSaveClick}
          >
            Save Entry
          </Button>
          <Button variant="light" className="px-4 fw-bold rounded-3" onClick={onClose}>Cancel</Button>
        </div>
      </Form>
    </Card>
  );
}

export default AddEntry;
