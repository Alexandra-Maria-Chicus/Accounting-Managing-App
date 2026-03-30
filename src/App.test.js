import { describe, it, expect } from 'vitest';
import { addEntry, deleteEntry, updateEntry } from './logic';

describe('Accounting App CRUD Implementation Tests', () => {

  it('TEST CREATE: should add a new firm to the RAM list', () => {
    const initialRAM = [];
    const newFirmName = "Valley Education";
    const employee = "Maria Chicus";
    
    const result = addEntry(initialRAM, newFirmName, employee, 2, 2026, '2026-04-05');
    
    expect(result.length).toBe(1);
    expect(result[0].firm).toBe("Valley Education");
    expect(result[0].status).toBe("Not Started"); 
  });

  it('TEST DELETE: should remove a specific firm by its ID', () => {
    const initialRAM = [
      { id: 101, firm: "Acme Corp" },
      { id: 102, firm: "TechStart" }
    ];
    
    const result = deleteEntry(initialRAM, 101);
    
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(102);
    expect(result.find(f => f.id === 101)).toBeUndefined();
  });

  it('TEST UPDATE: should update the status of an existing entry', () => {
    const initialRAM = [
      { id: 50, firm: "Global Logistics", status: "In Progress" }
    ];
    const updatedData = { id: 50, firm: "Global Logistics", status: "Finished" };
    
    const result = updateEntry(initialRAM, updatedData);
    
    expect(result[0].status).toBe("Finished");
    expect(result[0].firm).toBe("Global Logistics");
  });

  it('TEST VALIDATION: should not add an entry if the firm name is empty', () => {
    const initialRAM = [];
    const result = addEntry(initialRAM, "   ", "Maria", 2, 2026, '2026-04-05');
    
    expect(result.length).toBe(0); 
  });

  it('TEST BEST PRACTICE: should not mutate the original array', () => {
    const initialRAM = [{ id: 1, firm: "Original" }];
    const result = deleteEntry(initialRAM, 1);
    
    expect(initialRAM.length).toBe(1); 
    expect(result.length).toBe(0);    
  });

});