import { FIELD } from '../constants/styles.js';

export function Input({ className = '', block = true, ...props }) {
  return <input {...props} className={`${FIELD} ${block ? 'w-full' : ''} ${className}`} />;
}

export function Select({ className = '', block = true, children, ...props }) {
  return <select {...props} className={`${FIELD} ${block ? 'w-full' : ''} ${className}`}>{children}</select>;
}

export function Label({ htmlFor, children, className = '' }) {
  return <label htmlFor={htmlFor} className={`mb-1 block text-xs font-medium text-text-muted ${className}`}>{children}</label>;
}
