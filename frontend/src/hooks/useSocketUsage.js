// Subscribe to live gateway traffic for one API key over Socket.io. Accumulates
// a rolling window of recent events plus running totals for the dashboard.
import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket.js';

const WINDOW = 30; // keep the last N events for the chart

export function useSocketUsage(apiKeyId) {
  const [events, setEvents] = useState([]);
  const totals = useRef({ requests: 0, errors: 0 });
  const [summary, setSummary] = useState({ requests: 0, errors: 0 });

  useEffect(() => {
    if (!apiKeyId) return;

    // Reset when switching keys.
    totals.current = { requests: 0, errors: 0 };
    setSummary({ requests: 0, errors: 0 });
    setEvents([]);

    const onUsage = (evt) => {
      if (evt.apiKeyId !== apiKeyId) return;
      totals.current.requests += 1;
      if (evt.statusCode >= 400) totals.current.errors += 1;
      setSummary({ ...totals.current });
      setEvents((prev) => [...prev.slice(-(WINDOW - 1)), evt]);
    };

    socket.emit('subscribe', apiKeyId);
    socket.on('usage', onUsage);
    return () => {
      socket.emit('unsubscribe', apiKeyId);
      socket.off('usage', onUsage);
    };
  }, [apiKeyId]);

  return { events, summary };
}
