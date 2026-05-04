import { describe, it, expect } from 'vitest';
import { addEntry, deleteEntry, updateEntry } from './logic';

const makeEntry = (id, name = 'Acme') => ({
  id,
  firm: name,
  employee: 'Maria Chicus',
  status: 'Not Started',
  periodMonth: 0,
  periodYear: 2025,
  dateBrought: new Date('2025-01-10'),
});

describe('addEntry', () => {
  it('adds a new entry to the front of the list', () => {
    const result = addEntry([], 'Acme', 'Maria Chicus', 0, 2025, new Date());
    expect(result).toHaveLength(1);
    expect(result[0].firm).toBe('Acme');
    expect(result[0].status).toBe('Not Started');
  });

  it('prepends the new entry before existing ones', () => {
    const existing = [makeEntry(1)];
    const result = addEntry(existing, 'Beta', 'Maria Chicus', 1, 2025, new Date());
    expect(result).toHaveLength(2);
    expect(result[0].firm).toBe('Beta');
  });

  it('returns original list if name is empty', () => {
    const existing = [makeEntry(1)];
    expect(addEntry(existing, '', 'Maria', 0, 2025, new Date())).toBe(existing);
    expect(addEntry(existing, '  ', 'Maria', 0, 2025, new Date())).toBe(existing);
  });

  it('sets dateBrought to today if not provided', () => {
    const result = addEntry([], 'Acme', 'Maria', 0, 2025, null);
    expect(result[0].dateBrought).toBeInstanceOf(Date);
  });
});

describe('deleteEntry', () => {
  it('removes the entry with the given id', () => {
    const entries = [makeEntry(1), makeEntry(2), makeEntry(3)];
    const result = deleteEntry(entries, 2);
    expect(result).toHaveLength(2);
    expect(result.find(e => e.id === 2)).toBeUndefined();
  });

  it('returns all entries if id does not exist', () => {
    const entries = [makeEntry(1), makeEntry(2)];
    expect(deleteEntry(entries, 99)).toHaveLength(2);
  });

  it('returns empty array when deleting the only entry', () => {
    expect(deleteEntry([makeEntry(1)], 1)).toHaveLength(0);
  });
});

describe('updateEntry', () => {
  it('updates the matching entry', () => {
    const entries = [makeEntry(1), makeEntry(2)];
    const updated = { ...makeEntry(1), status: 'Finished' };
    const result = updateEntry(entries, updated);
    expect(result.find(e => e.id === 1).status).toBe('Finished');
  });

  it('does not modify other entries', () => {
    const entries = [makeEntry(1), makeEntry(2)];
    const updated = { ...makeEntry(1), status: 'In Progress' };
    const result = updateEntry(entries, updated);
    expect(result.find(e => e.id === 2).status).toBe('Not Started');
  });

  it('returns same length list', () => {
    const entries = [makeEntry(1), makeEntry(2)];
    expect(updateEntry(entries, { ...makeEntry(1), status: 'Finished' })).toHaveLength(2);
  });
});
