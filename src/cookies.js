export const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
};

export const getCookie = (name) => {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const savePeriodPreference = (month, year) => {
  setCookie('preferred_period', { month, year });
};

export const loadPeriodPreference = () => {
  return getCookie('preferred_period');
};

export const saveCurrentUser = (user) => {
  setCookie('current_user', {
    id: user.id,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    name: user.name,
  }, 1);
};

export const loadCurrentUser = () => {
  return getCookie('current_user');
};

export const clearCurrentUser = () => {
  deleteCookie('current_user');
};
