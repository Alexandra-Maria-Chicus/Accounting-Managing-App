import { describe, it, expect } from 'vitest';
import {
  validateCompany,
  addCompany,
  updateCompany,
  deleteCompany,
  addObservation,
  toggleObservation,
  deleteObservation,
} from './companiesLogic';

const validFields = {
  name: 'Acme Corp',
  email: 'info@acme.com',
  phone: '+40 722 100 200',
  address: 'Str. Memorandumului 1',
  contactName: 'John Doe',
  contactEmail: 'john@acme.com',
};

const makeCompany = (id, name = 'Acme Corp') => ({
  id,
  name,
  email: 'info@acme.com',
  phone: '+40 722 100 200',
  address: 'Str. Memorandumului 1',
  contactPerson: { name: 'John Doe', email: 'john@acme.com' },
  observations: [],
});

describe('validateCompany', () => {
  it('returns no errors for valid input', () => {
    expect(validateCompany(validFields, [])).toEqual({});
  });

  it('requires company name', () => {
    const e = validateCompany({ ...validFields, name: '' }, []);
    expect(e.name).toBeTruthy();
  });

  it('rejects name shorter than 2 characters', () => {
    const e = validateCompany({ ...validFields, name: 'A' }, []);
    expect(e.name).toBeTruthy();
  });

  it('rejects duplicate company name', () => {
    const existing = [makeCompany(1, 'Acme Corp')];
    const e = validateCompany(validFields, existing);
    expect(e.name).toMatch(/already exists/i);
  });

  it('allows same name when editing that company', () => {
    const existing = [makeCompany(1, 'Acme Corp')];
    expect(validateCompany(validFields, existing, 1)).toEqual({});
  });

  it('requires valid email', () => {
    expect(validateCompany({ ...validFields, email: 'bad-email' }, []).email).toBeTruthy();
    expect(validateCompany({ ...validFields, email: '' }, []).email).toBeTruthy();
  });

  it('requires phone', () => {
    expect(validateCompany({ ...validFields, phone: '' }, []).phone).toBeTruthy();
  });

  it('requires address of at least 5 characters', () => {
    expect(validateCompany({ ...validFields, address: 'abc' }, []).address).toBeTruthy();
  });

  it('requires contact name', () => {
    expect(validateCompany({ ...validFields, contactName: '' }, []).contactName).toBeTruthy();
  });

  it('requires valid contact email', () => {
    expect(validateCompany({ ...validFields, contactEmail: 'bad' }, []).contactEmail).toBeTruthy();
  });
});

describe('addCompany', () => {
  it('appends a new company to the list', () => {
    const result = addCompany([], validFields);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
    expect(result[0].observations).toEqual([]);
  });

  it('trims whitespace from fields', () => {
    const result = addCompany([], { ...validFields, name: '  Acme Corp  ' });
    expect(result[0].name).toBe('Acme Corp');
  });
});

describe('updateCompany', () => {
  it('updates the matching company', () => {
    const companies = [makeCompany(1), makeCompany(2, 'Beta')];
    const result = updateCompany(companies, 1, { ...validFields, name: 'Updated' });
    expect(result.find(c => c.id === 1).name).toBe('Updated');
  });

  it('does not modify other companies', () => {
    const companies = [makeCompany(1), makeCompany(2, 'Beta')];
    const result = updateCompany(companies, 1, validFields);
    expect(result.find(c => c.id === 2).name).toBe('Beta');
  });
});

describe('deleteCompany', () => {
  it('removes company with given id', () => {
    const companies = [makeCompany(1), makeCompany(2)];
    const result = deleteCompany(companies, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

describe('addObservation', () => {
  it('adds an observation to the correct company', () => {
    const companies = [makeCompany(1), makeCompany(2)];
    const result = addObservation(companies, 1, 'Missing invoice', 'Maria', 99);
    expect(result.find(c => c.id === 1).observations).toHaveLength(1);
    expect(result.find(c => c.id === 1).observations[0].text).toBe('Missing invoice');
    expect(result.find(c => c.id === 1).observations[0].checked).toBe(false);
  });

  it('does not affect other companies', () => {
    const companies = [makeCompany(1), makeCompany(2)];
    const result = addObservation(companies, 1, 'Note', 'Maria', 99);
    expect(result.find(c => c.id === 2).observations).toHaveLength(0);
  });
});

describe('toggleObservation', () => {
  it('flips checked from false to true', () => {
    const companies = [{ ...makeCompany(1), observations: [{ id: 10, text: 'x', checked: false }] }];
    const result = toggleObservation(companies, 1, 10);
    expect(result[0].observations[0].checked).toBe(true);
  });

  it('flips checked from true to false', () => {
    const companies = [{ ...makeCompany(1), observations: [{ id: 10, text: 'x', checked: true }] }];
    const result = toggleObservation(companies, 1, 10);
    expect(result[0].observations[0].checked).toBe(false);
  });
});

describe('deleteObservation', () => {
  it('removes the observation with the given id', () => {
    const companies = [{ ...makeCompany(1), observations: [{ id: 10, text: 'x', checked: false }, { id: 11, text: 'y', checked: false }] }];
    const result = deleteObservation(companies, 1, 10);
    expect(result[0].observations).toHaveLength(1);
    expect(result[0].observations[0].id).toBe(11);
  });
});
