import { request } from './client.js';

export const login = name => request('/auth/login', { method: 'POST', body: { name } });

export const getMe = () => request('/auth/me');

// { name, email, payroll } to self-register; a logged user can also send { champion }, an admin { role }
export const createUser = data => request('/users', { method: 'POST', body: data });

export const listUsers = () => request('/users');

// { id, name, champion } of every user, for any logged user
export const listUserNames = () => request('/users/names');

// Any of { name, email, payroll, avatar } (the avatar is a data URL, or null to remove it)
export const updateMe = data => request('/users/me', { method: 'PATCH', body: data });

// Marks a user as champion; returns its { id, name, champion }. For any logged user
export const markChampion = id => request(`/users/${id}/champion`, { method: 'PATCH' });

// Admins only. Any of { name, email, payroll, champion } of another user
export const updateUser = (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data });

export const updateUserRole = (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } });
