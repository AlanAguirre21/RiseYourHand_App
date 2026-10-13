import { BASE_URL, request } from './client.js';

export const getForm = () => request('/form');

export const submitResponse = (formVersion, answers) =>
  request('/form/responses', { method: 'POST', body: { formVersion, answers } });

// The manitas the user registered, plus the ones where they are the champion
export const listMyResponses = () => request('/form/responses');

// Admins only
export const listAllResponses = () => request('/form/responses?scope=all');

// Admins only. "answers" is a list of { questionKey, value }; the ones left out are kept
export const updateResponse = (id, answers) =>
  request(`/form/responses/${id}`, { method: 'PATCH', body: { answers } });

// Admins only. Every manita, for the dashboard
export const listDashboard = () => request('/form/dashboard');

// Every manita, for the tracking page: readable by any user
export const listTracking = () => request('/form/tracking');

// Admins only. { started: true } and/or { progress } (0 to 100)
export const updateResponseTracking = (id, data) =>
  request(`/form/responses/${id}/tracking`, { method: 'PATCH', body: data });

// Admins only. Link to every response as a CSV table, readable without a session (e.g. by Power BI)
export const getExportLink = async () => {
  const { key } = await request('/form/export-key');
  return new URL(`${BASE_URL}/form/responses.csv?key=${encodeURIComponent(key)}`, window.location.origin).href;
};
