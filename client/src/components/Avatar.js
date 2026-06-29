'use client';

import { useState, useEffect } from 'react';

// Shows the user's avatar image; if it's missing OR fails to load,
// falls back to coloured initials. No external avatar service needed.
export default function Avatar({ src, name = 'User', size = 40, className = '' }) {
  const [broken, setBroken] = useState(false);

  // reset the broken flag whenever the src changes (e.g. after an upload)
  useEffect(() => setBroken(false), [src]);

  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  const dimension = { width: size, height: size };

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        onError={() => setBroken(true)}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={dimension}
      className={`grid place-items-center rounded-full bg-brand-600 font-bold text-white ${className}`}
    >
      {initial}
    </div>
  );
}
