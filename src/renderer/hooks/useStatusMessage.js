import { useEffect, useState } from 'react';

export function useStatusMessage(timeout = 4000) {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), timeout);
    return () => clearTimeout(timer);
  }, [message, timeout]);

  return [message, setMessage];
}
