import { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { ArrowLeft, Envelope, Telephone, GeoAlt } from 'react-bootstrap-icons';

const STATUS_STYLE = {
  'Finished':    { backgroundColor: '#198754', color: '#fff' },
  'In Progress': { backgroundColor: '#0077b6', color: '#fff' },
  'Not Started': { backgroundColor: '#64748b', color: '#fff' },
};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function CompanyPage({ firm, allEntries, currentUser, onClose, onAddObservation, onToggleObservation, onDeleteObservation }) {
  const now = new Date();
  const [obsText, setObsText] = useState('');
  const [obsError, setObsError] = useState('');
  const [lastAddedId, setLastAddedId] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';
  const isClient = currentUser?.role === 'client';

  const currentMonthEntry = allEntries.find(e =>
    e.firm === firm.name &&
    e.periodMonth === now.getMonth() &&
    e.periodYear === now.getFullYear()
  );
  const history = allEntries
    .filter(e => e.firm === firm.name)
    .sort((a, b) => {
      if (b.periodYear !== a.periodYear) return b.periodYear - a.periodYear;
      return b.periodMonth - a.periodMonth;
    });

  const currentStatus = currentMonthEntry ? currentMonthEntry.status : 'Not Started';
  const observations = firm.observations || [];

  const handleAddObs = () => {
    if (!obsText.trim()) {
      setObsError('Please enter an observation.');
      return;
    }
    const newId = Date.now();
    onAddObservation(firm.id, obsText, newId);
    setLastAddedId(newId);
    setObsText('');
    setObsError('');
  };

  return (
    <Container className="py-4">
      {onClose && (
        <Button variant="link" onClick={onClose} className="text-decoration-none text-dark mb-4 p-0 shadow-none">
          <ArrowLeft className="me-2" /> Back to List
        </Button>
      )}

      <Card className="border-0 shadow-sm p-4 mb-4 rounded-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="fw-bold mb-1">{firm.name}</h2>
            <p className="text-muted small mb-0"><GeoAlt className="me-1" />{firm.address}</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Badge
              className="px-3 py-2"
              bg=""
              style={currentMonthEntry
                ? { backgroundColor: '#198754', color: '#fff' }
                : { backgroundColor: '#dc3545', color: '#fff' }}
            >
              {currentMonthEntry ? 'Received' : 'Not Received'}
            </Badge>
            <Badge
              className="px-3 py-2"
              bg=""
              style={STATUS_STYLE[currentStatus]}
            >
              {currentStatus}
            </Badge>
          </div>
        </div>
        <hr className="my-4" />
        <Row>
          {!isClient && (
            <Col md={6}>
              <p className="small text-muted fw-bold text-uppercase mb-1">Assigned Employee</p>
              <p className="fw-medium">{currentMonthEntry?.employee || 'Not Assigned'}</p>
            </Col>
          )}
          <Col md={isClient ? 12 : 6}>
            <p className="small text-muted fw-bold text-uppercase mb-1">Date Brought In</p>
            <p className="fw-medium">
              {currentMonthEntry
                ? currentMonthEntry.dateBrought.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'No documents brought yet'}
            </p>
          </Col>
        </Row>
      </Card>

      <Row>
        <Col lg={8}>
          {!isClient && (
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4">
              <h5 className="fw-bold mb-4">Contact Information</h5>
              <Row className="gy-3">
                <Col md={6}>
                  <label className="small text-muted d-block">Email</label>
                  <span className="fw-medium"><Envelope className="me-2" />{firm.email}</span>
                </Col>
                <Col md={6}>
                  <label className="small text-muted d-block">Phone</label>
                  <span className="fw-medium"><Telephone className="me-2" />{firm.phone}</span>
                </Col>
              </Row>
            </Card>
          )}

          {!isClient && (
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4">
              <h5 className="fw-bold mb-4">Activity History</h5>
              <div className="ps-3 border-start border-2" style={{ borderColor: '#e5e7eb' }}>
                {history.length > 0 ? history.map((record) => (
                  <div key={record.id} className="mb-4 position-relative">
                    <div
                      className="position-absolute rounded-circle"
                      style={{ left: '-17px', top: '5px', width: '10px', height: '10px', ...STATUS_STYLE[record.status] }}
                    />
                    <div className="d-flex justify-content-between">
                      <p className="fw-bold mb-0">
                        <Badge bg="" className="me-2 px-2 py-1" style={{ fontSize: '0.7rem', ...STATUS_STYLE[record.status] }}>
                          {record.status}
                        </Badge>
                        {monthNames[record.periodMonth]} {record.periodYear}
                      </p>
                      <span className="small text-muted">
                        {record.dateBrought.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="small text-muted mb-0">Processed by {record.employee}</p>
                  </div>
                )) : <p className="text-muted">No historical records found.</p>}
              </div>
            </Card>
          )}

          {isClient && (
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4">
              <h5 className="fw-bold mb-4">Documents History</h5>
              <div className="ps-3 border-start border-2" style={{ borderColor: '#e5e7eb' }}>
                {history.length > 0 ? history.map((record) => (
                  <div key={record.id} className="mb-4 position-relative">
                    <div
                      className="position-absolute rounded-circle"
                      style={{ left: '-17px', top: '5px', width: '10px', height: '10px', backgroundColor: '#198754' }}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="fw-bold mb-0">
                        {monthNames[record.periodMonth]} {record.periodYear}
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">
                          Brought in: {record.dateBrought.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <Badge bg="" style={{ fontSize: '0.7rem', ...STATUS_STYLE[record.status] }}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-muted">No documents found.</p>}
              </div>
            </Card>
          )}

          <Card className="border-0 shadow-sm p-4 rounded-4">
            <h5 className="fw-bold mb-1">Observations</h5>
            <p className="text-muted small mb-4">
              {isClient
                ? 'Notes left by your accountant. Please review and address any open items.'
                : 'Notes visible to the client. Use these to request missing documents or flag issues.'}
            </p>

            {(isAdmin || isEmployee) && (
              <div className="mb-4">
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g. Missing invoice for March, please bring the originals."
                    value={obsText}
                    onChange={(e) => { setObsText(e.target.value); setObsError(''); }}
                    isInvalid={!!obsError}
                    className="bg-light border-0 shadow-none rounded-3"
                  />
                  <Form.Control.Feedback type="invalid">{obsError}</Form.Control.Feedback>
                </Form.Group>
                <Button
                  className="mt-2 px-4 fw-bold border-0 rounded-3"
                  style={{ backgroundColor: '#FF6B00' }}
                  onClick={handleAddObs}
                >
                  Add Observation
                </Button>
              </div>
            )}

            {observations.length === 0 ? (
              <p className="text-muted small">No observations yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {observations.map((obs) => (
                  <div
                    key={obs.id}
                    className={`d-flex align-items-start gap-3 p-3 rounded-3${obs.id === lastAddedId ? ' obs-slide-in' : ''}`}
                    style={{ backgroundColor: obs.checked ? '#f0fdf4' : '#fff8f0', border: `1px solid ${obs.checked ? '#bbf7d0' : '#fed7aa'}` }}
                  >
                    <Form.Check
                      type="checkbox"
                      checked={obs.checked}
                      onChange={() => onToggleObservation(firm.id, obs.id)}
                      className="mt-1 shadow-none"
                      title={obs.checked ? 'Mark as open' : 'Mark as resolved'}
                    />
                    <div className="flex-grow-1">
                      <p className="mb-1 fw-medium" style={{ textDecoration: obs.checked ? 'line-through' : 'none', color: obs.checked ? '#6b7280' : '#1a1a1a' }}>
                        {obs.text}
                      </p>
                      <span className="small text-muted">
                        {obs.author} &mdash; {new Date(obs.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {(isAdmin || isEmployee) && (
                      <Button
                        variant="link"
                        className="text-danger p-0 shadow-none border-0"
                        onClick={() => onDeleteObservation(firm.id, obs.id)}
                        title="Delete observation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {!isClient && (
          <Col lg={4}>
            <Card className="border-0 shadow-sm p-4 rounded-4 text-center">
              <h5 className="fw-bold text-start mb-4">Primary Contact</h5>
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3 text-white"
                style={{ width: '64px', height: '64px', fontSize: '1.5rem', backgroundColor: '#FF6B00' }}
              >
                {firm.contactPerson.name.charAt(0)}
              </div>
              <p className="fw-bold mb-0">{firm.contactPerson.name}</p>
              <p className="text-muted small mb-4">{firm.contactPerson.email}</p>
              <Button
                variant="dark"
                className="w-100 py-2 rounded-3 border-0"
                style={{ backgroundColor: '#001529' }}
              >
                Send Email
              </Button>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default CompanyPage;
