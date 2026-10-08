import { BASE_URL, request } from './client.js';

export const getForm = () => request('/form');

export const submitResponse = (formVersion, answers) =>
  request('/form/responses', { method: 'POST', body: { formVersion, answers } });

export const listMyResponses = () => request('/form/responses');

// Admins only
export const listAllResponses = () => request('/form/responses?scope=all');

// Admins only. Link to every response as a CSV table, readable without a session (e.g. by Power BI)
export const getExportLink = async () => {
  const { key } = await request('/form/export-key');
  return new URL(`${BASE_URL}/form/responses.csv?key=${encodeURIComponent(key)}`, window.location.origin).href;
};
