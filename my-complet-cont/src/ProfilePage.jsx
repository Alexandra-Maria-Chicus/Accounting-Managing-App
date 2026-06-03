import { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { fetchProfile, deleteAccount } from './api';

const ROLE_COLOR = {
  admin:    '#dc3545',
  employee: '#FF6B00',
  client:   '#0077b6',
};

export default function ProfilePage({ onDeleted, onBack }) {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [confirm, setConfirm]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(e => setError(e.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    setDelError('');
    try {
      await deleteAccount();
      onDeleted();
    } catch (e) {
      setDelError(e.message || 'Failed to delete account.');
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" style={{ color: '#FF6B00' }} />
    </div>
  );

  if (error) return (
    <Alert variant="danger" className="rounded-4">{error}</Alert>
  );

  const initials = profile.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <Container style={{ maxWidth: '560px' }} className="py-2">
      <div className="d-flex align-items-center gap-2 mb-4">
        <Button variant="link" className="p-0 shadow-none text-muted" onClick={onBack} title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Button>
        <h5 className="mb-0 fw-bold">My Profile</h5>
      </div>

      {/* Avatar + name */}
      <Card className="border-0 shadow-sm rounded-4 p-4 mb-3">
        <div className="d-flex align-items-center gap-4">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=FF6B00&color=fff&size=80`}
            alt="Avatar"
            className="rounded-circle border"
            width="72" height="72"
          />
          <div>
            <div className="fw-bold fs-5">{profile.name}</div>
            <div className="text-muted small mb-1">{profile.email}</div>
            <Badge pill style={{ backgroundColor: ROLE_COLOR[profile.role] || '#6c757d', fontSize: '0.72rem' }}>
              {profile.role}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Organisation info */}
      {profile.organization && (
        <Card className="border-0 shadow-sm rounded-4 p-4 mb-3">
          <div className="small fw-bold text-muted text-uppercase mb-3">Organisation</div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Name</span>
            <span className="fw-medium small">{profile.organization.name}</span>
          </div>
          {profile.organization.staff_code && (
            <div className="d-flex justify-content-between">
              <span className="text-muted small">Staff code</span>
              <span className="fw-medium small" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {profile.organization.staff_code}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Company info (clients) */}
      {profile.company && (
        <Card className="border-0 shadow-sm rounded-4 p-4 mb-3">
          <div className="small fw-bold text-muted text-uppercase mb-3">Company</div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Name</span>
            <span className="fw-medium small">{profile.company.name}</span>
          </div>
          {profile.company.email && (
            <div className="d-flex justify-content-between">
              <span className="text-muted small">Email</span>
              <span className="fw-medium small">{profile.company.email}</span>
            </div>
          )}
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-0 shadow-sm rounded-4 p-4" style={{ borderTop: '2px solid #fee2e2' }}>
        <div className="small fw-bold text-uppercase mb-1" style={{ color: '#dc3545' }}>Danger zone</div>
        <div className="text-muted small mb-3">
          Deleting your account is permanent. Your documents and logs are preserved for audit purposes, but your login access will be removed immediately.
        </div>
        {delError && <Alert variant="danger" className="rounded-3 py-2 small mb-3">{delError}</Alert>}
        {!confirm ? (
          <Button
            variant="outline-danger"
            className="rounded-3 shadow-none"
            style={{ fontSize: '0.85rem' }}
            onClick={() => setConfirm(true)}
          >
            Delete my account
          </Button>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-danger fw-bold me-1">Are you sure? This cannot be undone.</span>
            <Button
              size="sm" variant="danger" className="shadow-none rounded-3"
              onClick={handleDelete} disabled={deleting}
            >
              {deleting ? <Spinner size="sm" /> : 'Yes, delete'}
            </Button>
            <Button
              size="sm" variant="light" className="shadow-none rounded-3"
              onClick={() => setConfirm(false)} disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </Container>
  );
}
