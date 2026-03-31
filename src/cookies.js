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

export const trackPageVisit = (pageName) => {
  const activity = getCookie('page_activity') || {};
  activity[pageName] = (activity[pageName] || 0) + 1;
  activity['last_visited'] = pageName;
  activity['last_visit_time'] = new Date().toISOString();
  setCookie('page_activity', activity, 30);
};

export const getPageActivity = () => {
  return getCookie('page_activity') || {};
};
