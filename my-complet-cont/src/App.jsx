import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import AddEntry from './AddEntry';
import EditEntry from './EditEntry';
import Home from './Home'
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CompaniesAdmin from './CompaniesAdmin';
import Chat from './Chat';
import * as api from './api';
import { savePeriodPreference, loadPeriodPreference, saveCurrentUser, loadCurrentUser, clearCurrentUser } from './cookies'
import CompanyPage from './CompanyPage';
import InlineCharts from './InlineCharts';
import { Container, Card, Table, Form, Row, Col, Button, Badge, Nav, Navbar } from 'react-bootstrap';

const STATUS_STYLE = {
  'Finished':    { backgroundColor: '#198754', color: '#fff' },
  'In Progress': { backgroundColor: '#FF6B00', color: '#fff' },
  'Not Started': { backgroundColor: '#0077b6', color: '#fff' },
};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const PAGE_SIZE = 10;

function toIsoDate(d) {
  if (!d) return new Date().toISOString().split('T')[0];
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return d;
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function App() {
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState(() => api.getQueue().length);
  const [showChat, setShowChat] = useState(false);

  // page cursor for infinite scroll
  const pageRef = useRef(1);
  const sentinelRef = useRef(null);
  const prefetchRef = useRef(null); // { page, items, total_pages }

  const savedUser = loadCurrentUser();
  const [currentUser, setCurrentUser] = useState(savedUser || null);

  const now = new Date();
  const savedPeriod = loadPeriodPreference();
  const [selectedMonth, setSelectedMonth] = useState(savedPeriod?.month ?? now.getMonth());
  const [selectedYear, setSelectedYear] = useState(savedPeriod?.year ?? now.getFullYear());
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedFirmData, setSelectedFirmData] = useState(null);
  const [detailBackView, setDetailBackView] = useState('table');
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [slidingOutId, setSlidingOutId] = useState(null);
  const [view, setView] = useState(() => {
    if (!savedUser) return 'home';
    if (savedUser.role === 'client') return 'details';
    return 'table';
  });

  // ── Infinite scroll loading ───────────────────────────────────────────────────

  const prefetch = useCallback((page, month, year) => {
    api.fetchRecords({ page, pageSize: PAGE_SIZE, month, year })
      .then(r => { prefetchRef.current = { page, items: r.items, total_pages: r.total_pages }; })
      .catch(() => {});
  }, []);

  // Reset and load page 1 whenever filters change
  useEffect(() => {
    let cancelled = false;
    pageRef.current = 1;
    prefetchRef.current = null;
    setEntries([]);
    setHasMore(true);

    api.fetchRecords({ page: 1, pageSize: PAGE_SIZE, month: selectedMonth, year: selectedYear })
      .then(result => {
        if (cancelled) return;
        setEntries(result.items);
        setHasMore(1 < result.total_pages);
        setIsOnline(true);
        if (result.total_pages > 1) prefetch(2, selectedMonth, selectedYear);
      })
      .catch(e => { if (!cancelled && e.name === 'TypeError') setIsOnline(false); });

    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear, prefetch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;
    try {
      let result;
      if (prefetchRef.current?.page === nextPage) {
        result = prefetchRef.current;
        prefetchRef.current = null;
      } else {
        const r = await api.fetchRecords({ page: nextPage, pageSize: PAGE_SIZE, month: selectedMonth, year: selectedYear });
        result = { page: nextPage, items: r.items, total_pages: r.total_pages };
      }

      setEntries(prev => [...prev, ...result.items]);
      pageRef.current = nextPage;
      const more = nextPage < result.total_pages;
      setHasMore(more);
      setIsOnline(true);

      if (more) prefetch(nextPage + 1, selectedMonth, selectedYear);
    } catch (e) {
      if (e.name === 'TypeError') setIsOnline(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, selectedMonth, selectedYear, prefetch]);

  // Keep a stable ref so the observer never needs to be recreated
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // Observe sentinel — created once, always calls the latest loadMore via ref
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── All entries + companies ───────────────────────────────────────────────────

  const loadAllEntries = useCallback(async () => {
    try {
      const result = await api.fetchAllRecords();
      setAllEntries(result.items);
    } catch { /* non-critical */ }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const comps = await api.fetchCompanies();
      setCompanies(comps);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadAllEntries(); }, [loadAllEntries]);
  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  // On mount: flush any ops queued from a previous offline session
  useEffect(() => {
    api.flushQueue().then(synced => {
      setPendingOps(api.getQueue().length);
      if (synced > 0) {
        loadAllEntries();
        loadCompanies();
      }
    });
  }, []);

  // ── WebSocket (Silver) ────────────────────────────────────────────────────────

  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket('ws://localhost:8000/ws');
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_records') {
          setEntries(prev => [...msg.data, ...prev]);
          setAllEntries(prev => [...msg.data, ...prev]);
        }
      };
    } catch { /* backend not running */ }
    return () => ws?.close();
  }, []);

  // ── Online / offline sync (Silver) ───────────────────────────────────────────

  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      const synced = await api.flushQueue();
      setPendingOps(api.getQueue().length);
      if (synced > 0) await Promise.all([loadAllEntries(), loadCompanies()]);
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [loadAllEntries, loadCompanies]);

  useEffect(() => {
    savePeriodPreference(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedFirmData) {
      const updated = companies.find(c => c.id === selectedFirmData.id);
      if (updated) setSelectedFirmData(updated);
    }
  }, [companies]);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  const handleLoginSuccess = (user) => {
    saveCurrentUser(user);
    setCurrentUser(user);
    if (user.role === 'client') {
      const firmData = companies.find(c => c.name === user.companyName);
      if (firmData) { setSelectedFirmData(firmData); setDetailBackView(null); setView('details'); }
      else setView('table');
    } else {
      setView('table');
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUser(null);
    setView('home');
  };

  // ── Records CRUD (update state in-place — no full reload) ────────────────────

  const handleSave = async (name, emp, periodMonth, periodYear, dateBrought) => {
    const data = { firm: name, employee: emp, status: 'Not Started', periodMonth, periodYear, dateBrought: toIsoDate(dateBrought) };
    try {
      const newRecord = await api.createRecord(data);
      setEntries(prev => [newRecord, ...prev]);
      setAllEntries(prev => [newRecord, ...prev]);
    } catch (e) {
      if (e.name === 'TypeError') {
        const temp = { id: -Date.now(), ...data };
        setEntries(prev => [temp, ...prev]);
        setAllEntries(prev => [temp, ...prev]);
        api.enqueueOp({ method: 'POST', path: '/records', body: data });
        setPendingOps(api.getQueue().length);
        setIsOnline(false);
      }
    }
    setView('table');
  };

  const handleUpdate = async (updatedItem) => {
    const data = {
      firm: updatedItem.firm, employee: updatedItem.employee, status: updatedItem.status,
      periodMonth: updatedItem.periodMonth, periodYear: updatedItem.periodYear,
      dateBrought: toIsoDate(updatedItem.dateBrought),
    };
    try {
      const updated = await api.updateRecord(updatedItem.id, data);
      setEntries(prev => prev.map(r => r.id === updatedItem.id ? updated : r));
      setAllEntries(prev => prev.map(r => r.id === updatedItem.id ? updated : r));
    } catch (e) {
      if (e.name === 'TypeError') {
        const patched = { ...updatedItem, dateBrought: data.dateBrought };
        setEntries(prev => prev.map(r => r.id === updatedItem.id ? patched : r));
        setAllEntries(prev => prev.map(r => r.id === updatedItem.id ? patched : r));
        api.enqueueOp({ method: 'PUT', path: `/records/${updatedItem.id}`, body: data });
        setPendingOps(api.getQueue().length);
        setIsOnline(false);
      }
    }
    setView('table');
    setEditingEntry(null);
  };

  const confirmDelete = () => {
    const id = deletingEntryId;
    setDeletingEntryId(null);
    setSlidingOutId(id);
    setTimeout(async () => {
      try {
        await api.deleteRecord(id);
      } catch (e) {
        if (e.name === 'TypeError') {
          api.enqueueOp({ method: 'DELETE', path: `/records/${id}` });
          setPendingOps(api.getQueue().length);
          setIsOnline(false);
        }
      }
      setEntries(prev => prev.filter(r => r.id !== id));
      setAllEntries(prev => prev.filter(r => r.id !== id));
      setSlidingOutId(null);
    }, 600);
  };

  // ── Companies CRUD ────────────────────────────────────────────────────────────

  const handleAddCompany = async (fields) => {
    const data = { name: fields.name, email: fields.email, phone: fields.phone, address: fields.address, contactPerson: { name: fields.contactName, email: fields.contactEmail } };
    const newComp = await api.createCompany(data);
    setCompanies(prev => [...prev, newComp]);
    return newComp;
  };

  const handleEditCompany = async (id, fields) => {
    const data = { name: fields.name, email: fields.email, phone: fields.phone, address: fields.address, contactPerson: { name: fields.contactName, email: fields.contactEmail } };
    const updated = await api.updateCompany(id, data);
    setCompanies(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const handleDeleteCompany = async (id) => {
    await api.deleteCompany(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  // ── Observations CRUD ─────────────────────────────────────────────────────────

  const handleAddObservation = async (companyId, text) => {
    const obs = await api.addObservation(companyId, { text, author: currentUser.name });
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, observations: [...c.observations, obs] } : c));
    return obs;
  };

  const handleToggleObservation = async (companyId, obsId) => {
    const obs = await api.toggleObservation(companyId, obsId);
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, observations: c.observations.map(o => o.id === obsId ? obs : o) } : c));
  };

  const handleDeleteObservation = async (companyId, obsId) => {
    await api.deleteObservation(companyId, obsId);
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, observations: c.observations.filter(o => o.id !== obsId) } : c));
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const openCompanyDetail = (companyName, backView) => {
    const details = companies.find(c => c.name === companyName) ?? { name: companyName, observations: [] };
    setSelectedFirmData(details);
    setDetailBackView(backView);
    setView('details');
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) years.push(y);

  const isAppView = view !== 'home' && view !== 'login' && view !== 'register';
  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';
  const isClient = currentUser?.role === 'client';
  const clientCompany = isClient ? companies.find(c => c.name === currentUser.companyName) : null;
  const uncheckedObsCount = clientCompany ? clientCompany.observations.filter(o => !o.checked).length : 0;

  return (
    <>
      {view === 'home' && <Home onGetStarted={() => setView('login')} onLogin={() => setView('login')} onRegister={() => setView('register')} />}
      {view === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setView('register')} registeredUsers={registeredUsers} />}
      {view === 'register' && <RegisterPage onGoToLogin={() => setView('login')} onRegister={(user) => setRegisteredUsers(prev => [...prev, user])} />}

      {isAppView && (
        <>
          {!isOnline && (
            <div className="alert alert-danger rounded-0 mb-0 py-2 text-center small fw-bold border-0" role="alert">
              You are offline — changes are saved locally and will sync when reconnected.
              {pendingOps > 0 && ` (${pendingOps} pending)`}
            </div>
          )}
          {isOnline && pendingOps > 0 && (
            <div className="alert alert-success rounded-0 mb-0 py-2 text-center small fw-bold border-0" role="alert">
              Back online — syncing {pendingOps} queued operation{pendingOps > 1 ? 's' : ''}…
            </div>
          )}

          <Navbar bg="white" className="border-bottom px-3 px-md-4 shadow-sm" expand="lg">
            <Navbar.Brand className="fw-bold d-flex align-items-center me-4">
              <img src="logo.png" alt="Logo" height="32" className="me-2" />
              <span style={{ color: '#FF6B00', fontSize: '1.3rem' }}>Complet Cont</span>
            </Navbar.Brand>
            {!isClient && <Navbar.Toggle aria-controls="main-nav" className="border-0 shadow-none" />}
            <Navbar.Collapse id="main-nav">
              {!isClient && (
                <Nav className="me-auto mt-2 mt-lg-0">
                  <div className="nav-pill-track">
                    <div className="nav-pill" style={{ transform: view === 'companies' ? 'translateX(100%)' : 'translateX(0)' }} />
                    <button className={`nav-pill-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Documents</button>
                    <button className={`nav-pill-btn${view === 'companies' ? ' active' : ''}`} onClick={() => setView('companies')}>Companies</button>
                  </div>
                </Nav>
              )}
              <Nav className={`align-items-center d-flex gap-3 mt-2 mt-lg-0 ${isClient ? 'ms-auto' : ''}`}>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=FF6B00&color=fff`}
                    alt="Profile" className="rounded-circle border" width="36" height="36"
                  />
                  <div className="navbar-user-label">
                    <span className="fw-bold d-block" style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>{currentUser?.name || 'User'}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{currentUser?.role}</span>
                  </div>
                </div>
                <Button variant="link" className="text-muted p-0 ms-1 shadow-none" title="Team Chat" onClick={() => setShowChat(prev => !prev)}>💬</Button>
                <Button variant="link" className="text-muted p-0 ms-1 shadow-none" title="Log out" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          <Container fluid="lg" className="py-4 py-md-5 px-3 px-md-4">

            {isClient && view === 'details' && uncheckedObsCount > 0 && (
              <div className="alert alert-warning rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm border-0 banner-bounce" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>You have <strong>{uncheckedObsCount} open observation{uncheckedObsCount > 1 ? 's' : ''}</strong> from your accountant. Please review them below.</span>
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
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="bg-light border-0 shadow-none py-2 rounded-3"
                        >
                          {monthNames.map((name, index) => <option key={index} value={index}>{name}</option>)}
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
                          {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md="auto" className="ms-md-auto d-flex gap-2 align-items-center">
                      {(isAdmin || isEmployee) && (
                        <Button
                          className="px-4 py-2 fw-bold shadow-none rounded-3 border-0"
                          style={{ backgroundColor: '#FF6B00', fontSize: '0.85rem' }}
                          onClick={() => setView('add')}
                        >
                          + Add New Entry
                        </Button>
                      )}
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
                        {(isAdmin || isEmployee) && <th className="pe-4 py-3 text-end text-uppercase small text-muted fw-bold">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((item) => (
                        <tr key={item.id} className={`align-middle${slidingOutId === item.id ? ' row-slide-out' : ''}`}>
                          <td className="ps-4 fw-medium" style={{ cursor: 'pointer', color: '#FF6B00' }} onClick={() => openCompanyDetail(item.firm, 'table')}>
                            {item.firm}
                          </td>
                          <td className="text-muted">{monthNames[item.periodMonth]} {item.periodYear}</td>
                          <td className="text-muted">{formatDate(item.dateBrought)}</td>
                          <td>{item.employee}</td>
                          <td>
                            <Badge pill className="fw-medium px-3 py-2" bg="" style={{ fontSize: '0.75rem', minWidth: '100px', display: 'inline-block', textAlign: 'center', ...STATUS_STYLE[item.status] }}>
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
                                  <Button variant="link" className="text-primary p-0 shadow-none border-0" onClick={() => { setEditingEntry(item); setView('edit'); }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  </Button>
                                  <Button variant="link" className="text-danger p-0 shadow-none border-0" onClick={() => setDeletingEntryId(item.id)}>
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

                  {entries.length === 0 && !loadingMore && (
                    <div className="text-center py-5 text-muted">No documents found for this period.</div>
                  )}

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="text-center py-3 text-muted small">
                    {loadingMore && (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Loading more…
                      </span>
                    )}
                    {!hasMore && entries.length > 0 && 'All records loaded'}
                  </div>
                </Card>

                <InlineCharts entries={allEntries} selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </>
            )}

            {view === 'add' && <AddEntry companies={companies} onClose={() => setView('table')} onSave={handleSave} />}
            {view === 'edit' && <EditEntry entry={editingEntry} onClose={() => setView('table')} onSave={handleUpdate} companies={companies} />}

            {view === 'details' && (
              <CompanyPage
                firm={selectedFirmData}
                allEntries={allEntries}
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
                onAdd={handleAddCompany}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
                onViewCompany={(name) => openCompanyDetail(name, 'companies')}
                isAdmin={isAdmin}
              />
            )}

          </Container>
        </>
      )}
      {showChat && isAppView && currentUser && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '380px', zIndex: 1000 }}>
          <Chat currentUser={currentUser} />
        </div>
      )}
    </>
  );
}

export default App;
