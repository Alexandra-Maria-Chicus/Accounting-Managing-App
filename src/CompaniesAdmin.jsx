import { useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import { Envelope, Telephone, GeoAlt } from 'react-bootstrap-icons';
import CompanyForm from './CompanyForm';
import { addCompany, updateCompany, deleteCompany } from './companiesLogic';

const PAGE_SIZE = 5;

function CompaniesAdmin({ companies, onCompaniesChange, onViewCompany, isAdmin = false }) {
  const [subView, setSubView] = useState('list');
  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(companies.length / PAGE_SIZE);
  const paginated = companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (fields) => {
    onCompaniesChange(addCompany(companies, fields));
    setSubView('list');
  };

  const handleEdit = (fields) => {
    onCompaniesChange(updateCompany(companies, editingCompany.id, fields));
    setEditingCompany(null);
    setSubView('list');
  };

  const handleDelete = (id) => {
    onCompaniesChange(deleteCompany(companies, id));
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
          contactName: editingCompany.contactPerson.name,
          contactEmail: editingCompany.contactPerson.email,
        }}
        onSave={handleEdit}
        onClose={() => setSubView('list')}
      />
    );
  }

  return (
    <div className="page-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
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

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 text-uppercase small text-muted fw-bold">Company</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Contact</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Phone</th>
              <th className="py-3 text-uppercase small text-muted fw-bold">Address</th>
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
                  <div className="fw-medium small">{company.contactPerson.name}</div>
                  <div className="small text-muted">{company.contactPerson.email}</div>
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

        {companies.length === 0 && (
          <div className="text-center py-5 text-muted">No companies yet. Add one to get started.</div>
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
