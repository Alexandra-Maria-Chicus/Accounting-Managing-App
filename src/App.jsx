import { useState } from 'react'
import './App.css'
import AddEntry from './AddEntry';
import EditEntry from './EditEntry';
import Home from './Home'
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CompaniesAdmin from './CompaniesAdmin';
import { addEntry, deleteEntry } from './logic';
import { recordsData } from './data'
import CompanyPage from './CompanyPage';
import { companiesData as initialCompanies } from './companies';
import { Container, Card, Table, Form, Row, Col, Button, Badge, Nav, Navbar } from 'react-bootstrap';

const STATUS_STYLE = {
  'Finished':    { backgroundColor: '#198754', color: '#fff' },
  'In Progress': { backgroundColor: '#0077b6', color: '#fff' },
  'Not Started': { backgroundColor: '#64748b', color: '#fff' },
};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function App() {
  const [entries, setEntries] = useState(recordsData);
  const [companies, setCompanies] = useState(initialCompanies);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedFirmData, setSelectedFirmData] = useState(null);
  const [detailBackView, setDetailBackView] = useState('table');
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [view, setView] = useState('home');

  const openCompanyDetail = (companyName, backView) => {
    const details = companies.find(c => c.name === companyName);
    if (details) {
      setSelectedFirmData(details);
      setDetailBackView(backView);
      setView('details');
    }
  };

  const handleUpdate = (updatedItem) => {
    setEntries(entries.map(item => item.id === updatedItem.id ? updatedItem : item));
    setView('table');
    setEditingEntry(null);
  };

  const confirmDelete = () => {
    setEntries(deleteEntry(entries, deletingEntryId));
    setDeletingEntryId(null);
  };

  const handleSave = (name, emp, periodMonth, periodYear, dateBrought) => {
    const newList = addEntry(entries, name, emp, periodMonth, periodYear, dateBrought);
    if (newList !== entries) {
      setEntries(newList);
      setView('table');
    }
  };

  const filteredEntries = entries.filter(item =>
    item.periodYear === selectedYear &&
    item.periodMonth === selectedMonth
  );

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) years.push(y);

  const isAppView = view !== 'home' && view !== 'login' && view !== 'register';

  return (
    <>
      {view === 'home' && (
        <Home
          onGetStarted={() => setView('table')}
          onLogin={() => setView('login')}
          onRegister={() => setView('register')}
        />
      )}

      {view === 'login' && (
        <LoginPage
          onLoginSuccess={() => setView('table')}
          onGoToRegister={() => setView('register')}
          registeredUsers={registeredUsers}
        />
      )}

      {view === 'register' && (
        <RegisterPage
          onGoToLogin={() => setView('login')}
          onRegister={(user) => setRegisteredUsers(prev => [...prev, user])}
        />
      )}

      {isAppView && (
        <>
          <Navbar bg="white" className="border-bottom px-4 shadow-sm" expand="lg">
            <Navbar.Brand className="fw-bold d-flex align-items-center me-4">
              <img src="logo.png" alt="Logo" height="32" className="me-2" />
              <span style={{ color: '#FF6B00', fontSize: '1.3rem' }}>Complet Cont</span>
            </Navbar.Brand>

            <Nav className="me-auto gap-1">
              <Button
                variant="link"
                className={`fw-bold shadow-none text-decoration-none px-3 py-2 rounded-3 ${view === 'table' ? 'text-dark bg-light' : 'text-muted'}`}
                onClick={() => setView('table')}
              >
                Documents
              </Button>
              <Button
                variant="link"
                className={`fw-bold shadow-none text-decoration-none px-3 py-2 rounded-3 ${view === 'companies' ? 'text-dark bg-light' : 'text-muted'}`}
                onClick={() => setView('companies')}
              >
                Companies
              </Button>
            </Nav>

            <Nav className="align-items-center d-flex gap-3">
              <div className="d-flex align-items-center gap-2">
                <img
                  src="https://ui-avatars.com/api/?name=Maria+Chicus&background=FF6B00&color=fff"
                  alt="Profile"
                  className="rounded-circle border"
                  width="36"
                  height="36"
                />
                <span className="fw-bold" style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>Maria Chicus</span>
              </div>
              <Button
                variant="link"
                className="text-muted p-0 ms-1 shadow-none"
                title="Log out"
                onClick={() => setView('home')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </Button>
            </Nav>
          </Navbar>

          <Container className="py-5">

            {/* ── DOCUMENTS TABLE ── */}
            {view === 'table' && (
              <>
                <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded-4">
                  <Row className="gx-3 gy-2 align-items-end">
                    <Col xs={6} md={2}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Month</Form.Label>
                        <Form.Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="bg-light border-0 shadow-none py-2 rounded-3"
                        >
                          {monthNames.map((name, index) => (
                            <option key={index} value={index}>{name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={6} md={2}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Year</Form.Label>
                        <Form.Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-light border-0 shadow-none py-2 rounded-3"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md="auto" className="ms-md-auto">
                      <Button
                        className="px-4 py-2 fw-bold shadow-none rounded-3 border-0"
                        style={{ backgroundColor: '#FF6B00', fontSize: '0.85rem' }}
                        onClick={() => setView('add')}
                      >
                        + Add New Entry
                      </Button>
                    </Col>
                  </Row>
                </Card>

                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                  <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Firm Name</th>
                        <th className="py-3 text-uppercase small text-muted fw-bold">Accounting Month</th>
                        <th className="py-3 text-uppercase small text-muted fw-bold">Date Brought In</th>
                        <th className="py-3 text-uppercase small text-muted fw-bold">Employee</th>
                        <th className="py-3 text-uppercase small text-muted fw-bold">Status</th>
                        <th className="pe-4 py-3 text-end text-uppercase small text-muted fw-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((item) => (
                        <tr key={item.id} className="align-middle">
                          <td
                            className="ps-4 fw-medium"
                            style={{ cursor: 'pointer', color: '#FF6B00' }}
                            onClick={() => openCompanyDetail(item.firm, 'table')}
                          >
                            {item.firm}
                          </td>
                          <td className="text-muted">
                            {monthNames[item.periodMonth]} {item.periodYear}
                          </td>
                          <td className="text-muted">
                            {item.dateBrought.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>{item.employee}</td>
                          <td>
                            <Badge
                              pill
                              className="fw-medium px-3 py-2"
                              bg=""
                              style={{ fontSize: '0.75rem', minWidth: '100px', display: 'inline-block', textAlign: 'center', ...STATUS_STYLE[item.status] }}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="pe-4 text-end">
                            {deletingEntryId === item.id ? (
                              <div className="d-flex justify-content-end align-items-center gap-2">
                                <span className="small text-danger fw-bold">Delete?</span>
                                <Button size="sm" variant="danger" className="py-0 px-2 shadow-none" onClick={confirmDelete}>Yes</Button>
                                <Button size="sm" variant="light" className="py-0 px-2 shadow-none" onClick={() => setDeletingEntryId(null)}>No</Button>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-end gap-3">
                                <Button
                                  variant="link"
                                  className="text-primary p-0 shadow-none border-0"
                                  onClick={() => { setEditingEntry(item); setView('edit'); }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-danger p-0 shadow-none border-0"
                                  onClick={() => setDeletingEntryId(item.id)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {filteredEntries.length === 0 && (
                    <div className="text-center py-5 text-muted">No documents found for this period.</div>
                  )}
                </Card>
              </>
            )}

            {/* ── ADD ENTRY ── */}
            {view === 'add' && (
              <AddEntry
                companies={companies}
                onClose={() => setView('table')}
                onSave={handleSave}
              />
            )}

            {/* ── EDIT ENTRY ── */}
            {view === 'edit' && (
              <EditEntry
                entry={editingEntry}
                onClose={() => setView('table')}
                onSave={handleUpdate}
                companies={companies}
              />
            )}

            {/* ── COMPANY DETAIL ── */}
            {view === 'details' && (
              <CompanyPage
                firm={selectedFirmData}
                allEntries={entries}
                onClose={() => setView(detailBackView)}
              />
            )}

            {/* ── COMPANIES ADMIN ── */}
            {view === 'companies' && (
              <CompaniesAdmin
                companies={companies}
                onCompaniesChange={setCompanies}
                onViewCompany={(name) => openCompanyDetail(name, 'companies')}
              />
            )}

          </Container>
        </>
      )}
    </>
  );
}

export default App;
