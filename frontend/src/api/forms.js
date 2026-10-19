import { BASE_URL, request } from './client.js';

export const getForm = () => request('/form');

export const submitResponse = (formVersion, answers) =>
  request('/form/responses', { method: 'POST', body: { formVersion, answers } });

// The manitas where the user is the champion or the person who reported it
export const listMyResponses = () => request('/form/responses');

// Admins only
export const listAllResponses = () => request('/form/responses?scope=all');

// Admins only. "answers" is a list of { questionKey, value }; the ones left out are kept
export const updateResponse = (id, answers) =>
  request(`/form/responses/${id}`, { method: 'PATCH', body: { answers } });

// Admins only. Marks a finished manita as awarded (true), or takes the award back (false)
export const awardResponse = (id, awarded) =>
  request(`/form/responses/${id}/award`, { method: 'PATCH', body: { awarded } });

// Admins only. Every manita, for the dashboard
export const listDashboard = () => request('/form/dashboard');

// Every manita, for the tracking page: readable by any user
export const listTracking = () => request('/form/tracking');

// Champions only. { started: true }, or { progress (0 to 100), evidence: { comment, image? } }
export const updateResponseTracking = (id, data) =>
  request(`/form/responses/${id}/tracking`, { method: 'PATCH', body: data });

// The evidences of the progress of a manita, newest first
export const listEvidence = id => request(`/form/responses/${id}/evidence`);

// Admins only. Link to every response as a CSV table, readable without a session (e.g. by Power BI)
export const getExportLink = async () => {
  const { key } = await request('/form/export-key');
  return new URL(`${BASE_URL}/form/responses.csv?key=${encodeURIComponent(key)}`, window.location.origin).href;
};
