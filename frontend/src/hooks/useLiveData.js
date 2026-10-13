import { useEffect, useState } from 'react';

const REFRESH_MS = 60_000;

// Loads data that depends on today's date (computed fields, tracking) and keeps it fresh while the
// page stays open: it is reloaded every REFRESH_MS and whenever the tab is shown again.
// "fetchData" must keep its identity between renders (a module function or a useCallback)
export function useLiveData(fetchData) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let loaded = false;

    const refresh = () => fetchData()
      .then(result => {
        if (!active) return;
        loaded = true;
        setData(result);
      })
      .catch(e => { if (active && !loaded) setError(e.message); });   // a failed reload keeps the data shown

    const refreshIfVisible = () => { if (document.visibilityState === 'visible') refresh(); };

    refresh();
    const timer = setInterval(refreshIfVisible, REFRESH_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [fetchData]);

  return { data, setData, error };
}
