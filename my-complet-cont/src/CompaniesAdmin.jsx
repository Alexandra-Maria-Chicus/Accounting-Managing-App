import { useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { Envelope, Telephone, GeoAlt } from 'react-bootstrap-icons';
import CompanyForm from './CompanyForm';
const PAGE_SIZE = 5;

function CompaniesAdmin({ companies, onAdd, onEdit, onDelete, onViewCompany, isAdmin = false }) {
  const [subView, setSubView] = useState('list');
  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : companies;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = async (fields) => {
    await onAdd(fields);
    setSubView('list');
  };

  const handleEdit = async (fields) => {
    await onEdit(editingCompany.id, fields);
    setEditingCompany(null);
    setSubView('list');
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setDeletingId(null);
    const newTotal = Math.ceil((companies.length - 1) / PAGE_SIZE);
    if (page > newTotal && newTotal > 0) setPage(newTotal);
  };

  if (subView === 'add') {
    return (
      <CompanyForm
        title="Add New Company"
        allCompanies={companies}
        editingId={null}
        onSave={handleAdd}
        onClose={() => setSubView('list')}
      />
    );
  }

  if (subView === 'edit' && editingCompany) {
    return (
      <CompanyForm
        title="Edit Company"
        allCompanies={companies}
        editingId={editingCompany.id}
        initial={{
          name: editingCompany.name,
          email: editingCompany.email,
          phone: editingCompany.phone,
          address: editingCompany.address,
          contactName: editingCompany.contact_person?.name ?? '',
          contactEmail: editingCompany.contact_person?.email ?? '',
          registrationCode: editingCompany.registration_code ?? '',
        }}
        onSave={handleEdit}
        onClose={() => setSubView('list')}
      />
    );
  }

  return (
    <div className="page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold m-0" style={{ color: '#001529' }}>Companies</h4>
          <p className="text-muted small mb-0">{companies.length} registered companies</p>
        </div>
        {isAdmin && (
          <Button
            className="px-4 py-2 fw-bold border-0 rounded-3"
            style={{ backgroundColor: '#FF6B00' }}
            onClick={() => setSubView('add')}
          >
            + Add Company
          </Button>
        )}
      </div>

      <div className="mb-3">
        <div className="d-flex align-items-center gap-2 px-3 rounded-3" style={{ background: '#f1f5f9', maxWidth: '320px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="border-0 bg-transparent py-2 w-100"
            style={{ outline: 'none', fontSize: '0.875rem', color: '#1a1a1a' }}
            placeholder="Search by name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="border-0 bg-transparent p-0 text-muted" style={{ lineHeight: 1 }} onClick={() => { setSearch(''); setPage(1); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Company</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Contact</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Phone</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Address</th>
              {isAdmin && <th className="py-3 text-uppercase small text-muted fw-bold">Firm Code</th>}
              {isAdmin && <th className="pe-4 py-3 text-end text-uppercase small text-muted fw-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((company) => (
              <tr key={company.id} className="align-middle">
                <td className="ps-4">
                  <div
                    className="fw-medium"
                    style={{ cursor: 'pointer', color: '#FF6B00' }}
                    onClick={() => onViewCompany(company.name)}
                  >
                    {company.name}
                  </div>
                  <div className="small text-muted d-flex align-items-center gap-1">
                    <Envelope size={11} />
                    {company.email}
                  </div>
                </td>
                <td>
                  <div className="fw-medium small">{company.contact_person?.name ?? '—'}</div>
                  <div className="small text-muted">{company.contact_person?.email ?? '—'}</div>
                </td>
                <td className="small text-muted">
                  <Telephone size={11} className="me-1" />
                  {company.phone}
                </td>
                <td className="small text-muted">
                  <GeoAlt size={11} className="me-1" />
                  {company.address}
                </td>
                {isAdmin && (
                  <td className="small text-muted" style={{ fontFamily: 'monospace' }}>
                    {company.registration_code ?? '—'}
                  </td>
                )}
                {isAdmin && (
                  <td className="pe-4 text-end">
                    {deletingId === company.id ? (
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        <span className="small text-danger fw-bold">Delete?</span>
                        <Button
                          size="sm"
                          variant="danger"
                          className="py-0 px-2 shadow-none"
                          onClick={() => handleDelete(company.id)}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          className="py-0 px-2 shadow-none"
                          onClick={() => setDeletingId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-end gap-3">
                        <Button
                          variant="link"
                          className="text-primary p-0 shadow-none border-0"
                          onClick={() => { setEditingCompany(company); setSubView('edit'); }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Button>
                        <Button
                          variant="link"
                          className="text-danger p-0 shadow-none border-0"
                          onClick={() => setDeletingId(company.id)}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>

        {filtered.length === 0 && (
          <div className="text-center py-5 text-muted">
            {search.trim() ? `No companies matching "${search}".` : 'No companies yet. Add one to get started.'}
          </div>
        )}

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
            <span className="small text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="light"
                className="shadow-none rounded-3"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </Button>
              <Button
                size="sm"
                variant="light"
                className="shadow-none rounded-3"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CompaniesAdmin;
