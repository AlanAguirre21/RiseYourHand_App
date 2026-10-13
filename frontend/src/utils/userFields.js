// Same rules as the backend (services/user.service.js)
export const NAME_MIN_LENGTH = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYROLL_PATTERN = /^[A-Z0-9-]{1,20}$/;

export const cleanName = name => name.trim().replace(/\s+/g, ' ');
export const cleanEmail = email => email.trim().toLowerCase();
export const cleanPayroll = payroll => payroll.trim().toUpperCase();

export const isValidName = name => name.length >= NAME_MIN_LENGTH;
export const isValidEmail = email => EMAIL_PATTERN.test(email);
export const isValidPayroll = payroll => PAYROLL_PATTERN.test(payroll);
