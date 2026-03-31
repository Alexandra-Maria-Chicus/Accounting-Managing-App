import { useState, useEffect } from 'react'
import './App.css'
import AddEntry from './AddEntry';
import EditEntry from './EditEntry';
import Home from './Home'
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CompaniesAdmin from './CompaniesAdmin';
import { addEntry, deleteEntry } from './logic';
import { recordsData } from './data'
import { savePeriodPreference, loadPeriodPreference, trackPageVisit } from './cookies'
import CompanyPage from './CompanyPage';
import { companiesData as initialCompanies } from './companies';
import { addObservation, toggleObservation, deleteObservation } from './companiesLogic';
import InlineCharts from './InlineCharts';
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
  const [currentUser, setCurrentUser] = useState(null);

  const now = new Date();
  const savedPeriod = loadPeriodPreference();
  const [selectedMonth, setSelectedMonth] = useState(savedPeriod?.month ?? now.getMonth());
  const [selectedYear, setSelectedYear] = useState(savedPeriod?.year ?? now.getFullYear());
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedFirmData, setSelectedFirmData] = useState(null);
  const [detailBackView, setDetailBackView] = useState('table');
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [view, setView] = useState('home');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    trackPageVisit(view);
  }, [view]);

  useEffect(() => {
    savePeriodPreference(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedFirmData) {
      const updated = companies.find(c => c.id === selectedFirmData.id);
      if (updated) setSelectedFirmData(updated);
    }
  }, [companies]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'client') {
      const firmData = companies.find(c => c.name === user.companyName);
      if (firmData) {
        setSelectedFirmData(firmData);
        setDetailBackView(null);
        setView('details');
      } else {
        setView('table');
      }
    } else {
      setView('table');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

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

  const handleAddObservation = (companyId, text, id) => {
    setCompanies(prev => addObservation(prev, companyId, text, currentUser.name, id));
  };

  const handleToggleObservation = (companyId, observationId) => {
    setCompanies(prev => toggleObservation(prev, companyId, observationId));
  };

  const handleDeleteObservation = (companyId, observationId) => {
    setCompanies(prev => deleteObservation(prev, companyId, observationId));
  };

  const filteredEntries = entries.filter(item =>
    item.periodYear === selectedYear &&
    item.periodMonth === selectedMonth
  );

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pagedEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) years.push(y);

  const isAppView = view !== 'home' && view !== 'login' && view !== 'register';
  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';
  const isClient = currentUser?.role === 'client';

  const clientCompany = isClient
    ? companies.find(c => c.name === currentUser.companyName)
    : null;
  const uncheckedObsCount = clientCompany
    ? clientCompany.observations.filter(o => !o.checked).length
    : 0;

  return (
    <>
      {view === 'home' && (
        <Home
          onGetStarted={() => setView('login')}
          onLogin={() => setView('login')}
          onRegister={() => setView('register')}
        />
      )}

      {view === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
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
          <Navbar bg="white" className="border-bottom px-3 px-md-4 shadow-sm" expand="lg">
            <Navbar.Brand className="fw-bold d-flex align-items-center me-4">
              <img src="logo.png" alt="Logo" height="32" className="me-2" />
              <span style={{ color: '#FF6B00', fontSize: '1.3rem' }}>Complet Cont</span>
            </Navbar.Brand>

            {!isClient && <Navbar.Toggle aria-controls="main-nav" className="border-0 shadow-none" />}

            <Navbar.Collapse id="main-nav">
              {!isClient && (
                <Nav className="me-auto gap-1 mt-2 mt-lg-0">
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
              )}

              <Nav className={`align-items-center d-flex gap-3 mt-2 mt-lg-0 ${isClient ? 'ms-auto' : ''}`}>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=FF6B00&color=fff`}
                    alt="Profile"
                    className="rounded-circle border"
                    width="36"
                    height="36"
                  />
                  <div className="navbar-user-label">
                    <span className="fw-bold d-block" style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
                      {currentUser?.name || 'User'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="text-muted p-0 ms-1 shadow-none"
                  title="Log out"
                  onClick={handleLogout}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          <Container fluid="lg" className="py-4 py-md-5 px-3 px-md-4">

            {isClient && view === 'details' && uncheckedObsCount > 0 && (
              <div className="alert alert-warning rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm border-0 banner-bounce" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>
                  You have <strong>{uncheckedObsCount} open observation{uncheckedObsCount > 1 ? 's' : ''}</strong> from your accountant. Please review them below.
                </span>
              </div>
            )}

            {view === 'table' && (
              <>
                <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded-4">
                  <Row className="gx-3 gy-2 align-items-end">
                    <Col xs={6} md={2}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Month</Form.Label>
                        <Form.Select
                          value={selectedMonth}
                          onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setCurrentPage(1); }}
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
                          onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setCurrentPage(1); }}
                          className="bg-light border-0 shadow-none py-2 rounded-3"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {(isAdmin || isEmployee) && (
                      <Col xs={12} md="auto" className="ms-md-auto">
                        <Button
                          className="px-4 py-2 fw-bold shadow-none rounded-3 border-0"
                          style={{ backgroundColor: '#FF6B00', fontSize: '0.85rem' }}
                          onClick={() => setView('add')}
                        >
                          + Add New Entry
                        </Button>
                      </Col>
                    )}
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
                        {(isAdmin || isEmployee) && (
                          <th className="pe-4 py-3 text-end text-uppercase small text-muted fw-bold">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEntries.map((item) => (
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
                          {(isAdmin || isEmployee) && (
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {filteredEntries.length === 0 && (
                    <div className="text-center py-5 text-muted">No documents found for this period.</div>
                  )}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-white">
                      <span className="small text-muted">
                        Page {currentPage} of {totalPages} &mdash; {filteredEntries.length} entries
                      </span>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="rounded-3 shadow-none"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                        >
                          &lsaquo; Prev
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            size="sm"
                            variant={page === currentPage ? 'dark' : 'outline-secondary'}
                            className="rounded-3 shadow-none"
                            style={page === currentPage ? { backgroundColor: '#FF6B00', borderColor: '#FF6B00' } : {}}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="rounded-3 shadow-none"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                        >
                          Next &rsaquo;
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                <InlineCharts
                  entries={entries}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </>
            )}

            {view === 'add' && (
              <AddEntry
                companies={companies}
                onClose={() => setView('table')}
                onSave={handleSave}
              />
            )}

            {view === 'edit' && (
              <EditEntry
                entry={editingEntry}
                onClose={() => setView('table')}
                onSave={handleUpdate}
                companies={companies}
              />
            )}

            {view === 'details' && (
              <CompanyPage
                firm={selectedFirmData}
                allEntries={entries}
                currentUser={currentUser}
                onClose={isClient ? null : () => setView(detailBackView)}
                onAddObservation={handleAddObservation}
                onToggleObservation={handleToggleObservation}
                onDeleteObservation={handleDeleteObservation}
              />
            )}

            {view === 'companies' && (
              <CompaniesAdmin
                companies={companies}
                onCompaniesChange={setCompanies}
                onViewCompany={(name) => openCompanyDetail(name, 'companies')}
                isAdmin={isAdmin}
              />
            )}

          </Container>
        </>
      )}
    </>
  );
}

export default App;
