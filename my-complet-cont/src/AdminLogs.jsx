import { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';

const BASE = 'http://localhost:8000';

function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    fetch(`${BASE}/logs`).then(r => r.json()).then(setLogs).catch(() => {});
    fetch(`${BASE}/logs/suspicious`).then(r => r.json()).then(setSuspicious).catch(() => {});
  }, []);

  const resolveFlag = async (id) => {
    await fetch(`${BASE}/logs/suspicious/${id}/resolve`, { method: 'PATCH' });
    setSuspicious(prev => prev.filter(f => f.id !== id));
  };

  const ACTION_COLOR = {
    'LOGIN': 'success',
    'LOGIN_FAILED': 'danger',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info',
  };

  return (
    <div className="page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0" style={{ color: '#001529' }}>System Logs</h4>
          <p className="text-muted small mb-0">
            {suspicious.length > 0 && (
              <span className="text-danger fw-bold">⚠ {suspicious.length} suspicious user{suspicious.length > 1 ? 's' : ''} detected</span>
            )}
            {suspicious.length === 0 && 'No suspicious activity detected'}
          </p>
        </div>
      </div>

      <div className="nav-pill-track mb-4" style={{ width: 'fit-content' }}>
        <div className="nav-pill" style={{ transform: activeTab === 'suspicious' ? 'translateX(100%)' : 'translateX(0)' }} />
        <button className={`nav-pill-btn${activeTab === 'logs' ? ' active' : ''}`} onClick={() => setActiveTab('logs')}>
          All Logs
        </button>
        <button className={`nav-pill-btn${activeTab === 'suspicious' ? ' active' : ''}`} onClick={() => setActiveTab('suspicious')}>
          Suspicious {suspicious.length > 0 && `(${suspicious.length})`}
        </button>
      </div>

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
                  <td className="ps-4 small text-muted">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </td>
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
          {logs.length === 0 && (
            <div className="text-center py-5 text-muted">No logs yet.</div>
          )}
        </Card>
      )}

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
                  <td className="ps-4 small text-muted">
                    {new Date(flag.detected_at).toLocaleString('en-GB')}
                  </td>
                  <td className="small fw-medium text-danger">{flag.user_email}</td>
                  <td className="small">{flag.reason}</td>
                  <td className="pe-4">
                    <Button
                      size="sm"
                      variant="outline-success"
                      className="rounded-3 shadow-none"
                      onClick={() => resolveFlag(flag.id)}
                    >
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {suspicious.length === 0 && (
            <div className="text-center py-5 text-muted">No suspicious activity detected.</div>
          )}
        </Card>
      )}
    </div>
  );
}

export default AdminLogs;