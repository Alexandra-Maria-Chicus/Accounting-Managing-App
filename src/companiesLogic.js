// Validation rules for company fields
export const validateCompany = (fields, allCompanies, editingId = null) => {
  const errors = {};

  if (!fields.name.trim()) {
    errors.name = 'Company name is required.';
  } else if (fields.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else {
    const duplicate = allCompanies.find(
      c => c.name.toLowerCase() === fields.name.trim().toLowerCase() && c.id !== editingId
    );
    if (duplicate) errors.name = 'A company with this name already exists.';
  }

  if (!fields.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!fields.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^\+?[\d\s\-().]{7,20}$/.test(fields.phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!fields.address.trim()) {
    errors.address = 'Address is required.';
  } else if (fields.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters.';
  }

  if (!fields.contactName.trim()) {
    errors.contactName = 'Contact person name is required.';
  }

  if (!fields.contactEmail.trim()) {
    errors.contactEmail = 'Contact email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contactEmail)) {
    errors.contactEmail = 'Please enter a valid contact email.';
  }

  return errors;
};

export const addCompany = (companies, fields) => {
  const newCompany = {
    id: Date.now(),
    name: fields.name.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
    address: fields.address.trim(),
    contactPerson: {
      name: fields.contactName.trim(),
      email: fields.contactEmail.trim(),
    },
  };
  return [...companies, newCompany];
};

export const updateCompany = (companies, id, fields) => {
  return companies.map(c =>
    c.id === id
      ? {
          ...c,
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          address: fields.address.trim(),
          contactPerson: {
            name: fields.contactName.trim(),
            email: fields.contactEmail.trim(),
          },
        }
      : c
  );
};

export const deleteCompany = (companies, id) => {
  return companies.filter(c => c.id !== id);
};
