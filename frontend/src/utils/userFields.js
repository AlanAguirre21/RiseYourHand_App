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

// Besides the name, a user needs the email or the payroll number (at least one). Each one can be
// left empty, but if it is written it has to be valid
export const CONTACT_HINT = 'Escribe al menos uno: el correo electrónico o el número de nómina.';
export const isValidContact = ({ email, payroll }) =>
  Boolean(email || payroll) && (!email || isValidEmail(email)) && (!payroll || isValidPayroll(payroll));
