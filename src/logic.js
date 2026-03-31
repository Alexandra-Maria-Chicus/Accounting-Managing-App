export const addEntry = (entries, name, emp, periodMonth, periodYear, dateBrought) => {
  if (!name || name.trim() === '') return entries;

  const newEntry = {
    id: Date.now(),
    firm: name,
    employee: emp,
    status: 'Not Started',
    periodMonth,
    periodYear,
    dateBrought: dateBrought ? new Date(dateBrought) : new Date(),
  };
  return [newEntry, ...entries];
};

export const deleteEntry = (entries, id) => {
  return entries.filter(entry => entry.id !== id);
};

export const updateEntry = (entries, updatedItem) => {
  return entries.map(item => item.id === updatedItem.id ? updatedItem : item);
};
