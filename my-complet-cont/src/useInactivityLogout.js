import { useEffect, useRef } from 'react';

const TIMEOUT_MS = 30 * 60 * 1000;
const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export default function useInactivityLogout(onLogout, isActive) {
  const onLogoutRef = useRef(onLogout);
  const timerRef = useRef(null);

  useEffect(() => { onLogoutRef.current = onLogout; }, [onLogout]);

  useEffect(() => {
    if (!isActive) return;

    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onLogoutRef.current(), TIMEOUT_MS);
    };

    reset();
    EVENTS.forEach(evt => window.addEventListener(evt, reset, { passive: true }));

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach(evt => window.removeEventListener(evt, reset));
    };
  }, [isActive]);
}
