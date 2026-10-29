import { useEffect, useState } from 'react';
import { centerCall } from './centerApi.js';

export default function useCenterSnapshot(childUid, membershipKey = '') {
  const requestKey = `${childUid || ''}:${membershipKey}`;
  const [state, setState] = useState({ key: requestKey, data: null, error: null, loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setState(previous => ({ key: requestKey, data: previous.key === requestKey ? previous.data : null, error: null, loading: true }));
    centerCall({ action: 'student', ...(childUid ? { childUid } : {}) }).then(data => {
      if (current) setState({ key: requestKey, data, error: null, loading: false });
    }).catch(error => { if (current) setState({ key: requestKey, data: null, error, loading: false }); });
    return () => { current = false; };
  }, [childUid, membershipKey, revision]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('focus', refresh);
    window.addEventListener('synaq:center-change', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('synaq:center-change', refresh); };
  }, []);
  return { ...(state.key === requestKey ? state : { data: null, error: null, loading: true }), refresh: () => setRevision(value => value + 1) };
}
