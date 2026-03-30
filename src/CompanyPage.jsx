import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { ArrowLeft, Envelope, Telephone, GeoAlt } from 'react-bootstrap-icons';

const STATUS_STYLE = {
  'Finished':    { backgroundColor: '#198754', color: '#fff' },
  'In Progress': { backgroundColor: '#0077b6', color: '#fff' },
  'Not Started': { backgroundColor: '#64748b', color: '#fff' },
};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function CompanyPage({ firm, allEntries, onClose }) {
  const now = new Date();

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

  return (
    <Container className="py-4">
      <Button variant="link" onClick={onClose} className="text-decoration-none text-dark mb-4 p-0 shadow-none">
        <ArrowLeft className="me-2" /> Back to List
      </Button>

      {/* Header Summary */}
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
          <Col md={6}>
            <p className="small text-muted fw-bold text-uppercase mb-1">Assigned Employee</p>
            <p className="fw-medium">{currentMonthEntry?.employee || 'Not Assigned'}</p>
          </Col>
          <Col md={6}>
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

          <Card className="border-0 shadow-sm p-4 rounded-4">
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
        </Col>

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
      </Row>
    </Container>
  );
}

export default CompanyPage;
