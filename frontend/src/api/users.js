import { request } from './client.js';

export const login = name => request('/auth/login', { method: 'POST', body: { name } });

export const getMe = () => request('/auth/me');

// { name, email, payroll } to self-register; an admin can also send { role }
export const createUser = data => request('/users', { method: 'POST', body: data });

export const listUsers = () => request('/users');

// { id, name, champion } of every user, for any logged user
export const listUserNames = () => request('/users/names');

// Any of { name, email, payroll, avatar } (the avatar is a data URL, or null to remove it)
export const updateMe = data => request('/users/me', { method: 'PATCH', body: data });

// Admins only. Any of { name, email, payroll } of another user, and { area } of a champion
export const updateUser = (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data });

// Admins only. Deactivates the user: their manitas are kept
export const deleteUser = id => request(`/users/${id}`, { method: 'DELETE' });

export const updateUserRole =(id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } });
