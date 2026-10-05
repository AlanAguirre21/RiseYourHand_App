import { request } from './client.js';

export const getForm = () => request('/form');

export const submitResponse = (formVersion, answers) =>
  request('/form/responses', { method: 'POST', body: { formVersion, answers } });

export const listMyResponses = () => request('/form/responses');

// Admins only
export const listAllResponses = () => request('/form/responses?scope=all');
