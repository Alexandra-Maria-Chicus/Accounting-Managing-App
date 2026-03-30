import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { CheckCircle } from 'react-bootstrap-icons'; 

function Home({ onGetStarted, onLogin, onRegister }) {
  const brandOrange = '#FF6B00';
  const textDark = '#1a1a1a';
  const textMuted = '#6c757d';

  return (
    <>
      <Container fluid className="bg-white border-bottom shadow-sm sticky-top px-5 py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center ">
            <img src="logo.png" alt="Logo" width="50" /> 
            <span className="fw-bold fs-5" style={{ color: brandOrange }}>Complet Cont</span>
          </div>
          <div className="d-flex gap-2">
            <Button variant="link" className="text-muted fw-bold p-0 me-3" onClick={onLogin}>Login</Button>
            <Button variant="dark" className="px-3 border-0 rounded-pill" style={{ backgroundColor: brandOrange, fontSize:'0.85rem' }} onClick={onRegister}>
              Register
            </Button>
          </div>
        </div>
      </Container>

      <Container className="py-5 bg-white rounded-4 shadow-sm my-5 text-center">
          <img src="logo.png" alt="Big Logo"  height="200" />
        
        <h1 className="fw-bolder mb-2 display-3" style={{ color: brandOrange }}>
          Complet Cont
        </h1>
        
        <h3 className="fw-bold text-dark mb-3" style={{ color: textDark }}>
          Your Accounting, Simplified
        </h3>
        
        <p className="mx-auto mb-5 text-muted px-lg-5" style={{ maxWidth: '800px', color: textMuted, lineHeight:'1.75' }}>
          A centralized platform for monitoring documents and managing accounting workflows. Track
          document submissions, monitor processing status, and collaborate efficiently with your team.
        </p>

        <Row className="gx-4 mb-5 text-start">
          <Col md={4} className="mb-4">
            <Card className="border-0 bg-light p-4 rounded-4 h-100 shadow-sm">
              <div className="fs-3 mb-2" style={{ color: brandOrange }}>
                <CheckCircle />
              </div>
              <Card.Title className="fw-bold fs-5" style={{ color: textDark }}>Document Monitoring</Card.Title>
              <Card.Text className="text-muted small" style={{ color: textMuted }}>
                Track all client documents in a single location
              </Card.Text>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="border-0 p-4 rounded-4 h-100 text-light shadow" style={{ backgroundColor: '#5c7cfa' }}>
              <div className="fs-3 mb-2">
                <CheckCircle />
              </div>
              <Card.Title className="fw-bold fs-5 text-white">Workflow Management</Card.Title>
              <Card.Text className="small text-white-50">
                Manage the accounting process from start to finish
              </Card.Text>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="border-0 bg-light p-4 rounded-4 h-100 shadow-sm">
              <div className="fs-3 mb-2" style={{ color: brandOrange }}>
                <CheckCircle />
              </div>
              <Card.Title className="fw-bold fs-5" style={{ color: textDark }}>Team Collaboration</Card.Title>
              <Card.Text className="text-muted small" style={{ color: textMuted }}>
                Work together with colleagues in real-time
              </Card.Text>
            </Card>
          </Col>
        </Row>

        <div className="d-flex justify-content-center gap-2 mb-4">
          <Button 
            variant="dark" 
            className="px-5 border-0 rounded- pill shadow-none" 
            style={{ backgroundColor: brandOrange }}
            onClick={onGetStarted} 
          >
            Get Started <span className="small">→</span>
          </Button>
          <Button variant="light" className="px-5 text-muted shadow-none rounded-pill" onClick={onLogin}>
            I Have an Account
          </Button>
        </div>
      </Container>
    </>
  );
}

export default Home;