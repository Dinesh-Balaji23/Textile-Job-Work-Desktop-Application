import { useState } from 'react';

export function useStatusMessage() {
  const [status, setStatus] = useState(null);

  const clearStatus = () => setStatus(null);

  return [status, setStatus, clearStatus];
}
