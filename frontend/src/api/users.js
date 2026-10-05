import { request } from './client.js';

export const login = name => request('/auth/login', { method: 'POST', body: { name } });

export const getMe = () => request('/auth/me');

// { name } to self-register; an admin can also send { role }
export const createUser = data => request('/users', { method: 'POST', body: data });

export const listUsers = () => request('/users');

// { name } and/or { avatar } (a data URL, or null to remove it)
export const updateMe = data => request('/users/me', { method: 'PATCH', body: data });

export const updateUserRole = (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } });
