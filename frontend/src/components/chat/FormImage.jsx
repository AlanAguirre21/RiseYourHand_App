import { useState } from 'react';

// A picture of the form (question or option). If the file is not there yet it is just not shown
export default function FormImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`block object-contain ${className}`} />;
}
