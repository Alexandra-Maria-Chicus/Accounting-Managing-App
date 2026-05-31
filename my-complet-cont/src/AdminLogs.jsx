import { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { fetchLogs, fetchSuspicious, resolveFlag as apiFlagResolve, fetchUsers, updateUserRole } from './api';

function AdminLogs() {
  const [logs,       setLogs]       = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [users,      setUsers]      = useState([]);
  const [activeTab,  setActiveTab]  = useState('logs');

  useEffect(() => {
    fetchLogs().then(setLogs).catch(() => {});
    fetchSuspicious().then(setSuspicious).catch(() => {});
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const resolveFlag = async (id) => {
    await apiFlagResolve(id);
    setSuspicious(prev => prev.filter(f => f.id !== id));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  const ACTION_COLOR = {
    'LOGIN':        'success',
    'LOGIN_FAILED': 'danger',
    'POST':         'primary',
    'PUT':          'warning',
    'DELETE':       'danger',
    'PATCH':        'info',
  };

  const TABS = [
    { key: 'logs',       label: 'All Logs' },
    { key: 'suspicious', label: `Suspicious${suspicious.length > 0 ? ` (${suspicious.length})` : ''}` },
    { key: 'users',      label: 'Team' },
  ];

  return (
    <div className="page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0" style={{ color: '#001529' }}>Administration</h4>
          <p className="text-muted small mb-0">
            {suspicious.length > 0
              ? <span className="text-danger fw-bold">⚠ {suspicious.length} suspicious user{suspicious.length > 1 ? 's' : ''} detected</span>
              : 'No suspicious activity detected'}
          </p>
        </div>
      </div>

      <div className="nav-pill-track mb-4" style={{ width: 'fit-content' }}>
        <div className="nav-pill" style={{
          transform: `translateX(${TABS.findIndex(t => t.key === activeTab) * 100}%)`,
          width: `calc((100% - ${(TABS.length - 1) * 8}px) / ${TABS.length})`,
        }} />
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`nav-pill-btn${activeTab === tab.key ? ' active' : ''}`}
            style={{ minWidth: '130px' }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── All Logs ── */}
      {activeTab === 'logs' && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Timestamp</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">User</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Role</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Action</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Details</th>
                <th className="pe-4 py-3 text-uppercase small text-muted fw-bold">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="align-middle">
                  <td className="ps-4 small text-muted">{new Date(log.timestamp).toLocaleString('en-GB')}</td>
                  <td className="small fw-medium">{log.user_email}</td>
                  <td>
                    <Badge bg="" style={{ backgroundColor: log.role === 'admin' ? '#001529' : '#6c757d', fontSize: '0.7rem' }}>
                      {log.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={ACTION_COLOR[log.action] || 'secondary'} style={{ fontSize: '0.7rem' }}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="small text-muted">{log.details}</td>
                  <td className="pe-4 small text-muted">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {logs.length === 0 && <div className="text-center py-5 text-muted">No logs yet.</div>}
        </Card>
      )}

      {/* ── Suspicious ── */}
      {activeTab === 'suspicious' && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Detected At</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">User</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Reason</th>
                <th className="pe-4 py-3 text-uppercase small text-muted fw-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {suspicious.map(flag => (
                <tr key={flag.id} className="align-middle">
                  <td className="ps-4 small text-muted">{new Date(flag.detected_at).toLocaleString('en-GB')}</td>
                  <td className="small fw-medium text-danger">{flag.user_email}</td>
                  <td className="small">{flag.reason}</td>
                  <td className="pe-4">
                    <Button size="sm" variant="outline-success" className="rounded-3 shadow-none" onClick={() => resolveFlag(flag.id)}>
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {suspicious.length === 0 && <div className="text-center py-5 text-muted">No suspicious activity detected.</div>}
        </Card>
      )}

      {/* ── Team (Users) ── */}
      {activeTab === 'users' && (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Name</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Email</th>
                <th className="py-3 text-uppercase small text-muted fw-bold">Role</th>
                <th className="pe-4 py-3 text-end text-uppercase small text-muted fw-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="align-middle">
                  <td className="ps-4 fw-medium small">{u.name}</td>
                  <td className="small text-muted">{u.email}</td>
                  <td>
                    <Badge bg="" style={{
                      backgroundColor: u.role === 'admin' ? '#001529' : u.role === 'employee' ? '#FF6B00' : '#0077b6',
                      fontSize: '0.7rem',
                    }}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="pe-4 text-end">
                    {u.role === 'employee' && (
                      <Button size="sm" variant="outline-dark" className="rounded-3 shadow-none"
                        onClick={() => handleRoleChange(u.id, 'admin')}>
                        Make Admin
                      </Button>
                    )}
                    {u.role === 'admin' && (
                      <Button size="sm" variant="outline-secondary" className="rounded-3 shadow-none"
                        onClick={() => handleRoleChange(u.id, 'employee')}>
                        Demote to Employee
                      </Button>
                    )}
                    {u.role === 'client' && (
                      <span className="small text-muted">Client</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {users.length === 0 && <div className="text-center py-5 text-muted">No team members found.</div>}
        </Card>
      )}
    </div>
  );
}

export default AdminLogs;
