export const HARDCODED_USERS = [
  { id: 'admin', email: 'admin@completcont.ro',      password: 'admin123',    name: 'Admin',             role: 'admin',    companyName: null },
  { id: 'e-1',   email: 'maria@completcont.ro',      password: 'employee123', name: 'Maria Chicus',      role: 'employee', companyName: null },
  { id: 'e-2',   email: 'sarah@completcont.ro',      password: 'employee123', name: 'Sarah Johnson',     role: 'employee', companyName: null },
  { id: 'e-3',   email: 'michael@completcont.ro',    password: 'employee123', name: 'Michael Chen',      role: 'employee', companyName: null },
  { id: 'c-1',   email: 'finance@valleyedu.org',     password: 'client123',   name: 'Dr. Sarah Mitchell',role: 'client',   companyName: 'Valley Education' },
  { id: 'c-2',   email: 'j.doe@acme.com',            password: 'client123',   name: 'John Doe',          role: 'client',   companyName: 'Acme Corporation' },
  { id: 'c-3',   email: 'alice@techstart.io',        password: 'client123',   name: 'Alice Vance',       role: 'client',   companyName: 'TechStart Inc.' },
  { id: 'c-4',   email: 'm.stevens@global.ro',       password: 'client123',   name: 'Mark Stevens',      role: 'client',   companyName: 'Global Logistics' },
  { id: 'c-5',   email: 'e.popescu@riverside.med',   password: 'client123',   name: 'Elena Popescu',     role: 'client',   companyName: 'Riverside Medical' },
  { id: 'c-6',   email: 'g.marin@downtown.ro',       password: 'client123',   name: 'George Marin',      role: 'client',   companyName: 'Downtown Retail' },
  { id: 'c-7',   email: 'ana@mtncoffee.com',         password: 'client123',   name: 'Ana Maria',         role: 'client',   companyName: 'Mountain Coffee' },
  { id: 'c-8',   email: 'v.ionescu@prectech.ro',     password: 'client123',   name: 'Victor Ionescu',    role: 'client',   companyName: 'Precision Tech' },
  { id: 'c-9',   email: 'laura@bluewave.ro',         password: 'client123',   name: 'Laura Dumitru',     role: 'client',   companyName: 'Blue Wave Agency' },
  { id: 'c-10',  email: 'r.filipescu@greenenergy.ro',password: 'client123',   name: 'Radu Filipescu',    role: 'client',   companyName: 'Green Energy Solutions' },
];

export const findUser = (email, password, registeredUsers = []) => {
  const hardcoded = HARDCODED_USERS.find(u => u.email === email && u.password === password);
  if (hardcoded) return hardcoded;
  return registeredUsers.find(u => u.email === email && u.password === password) || null;
};
