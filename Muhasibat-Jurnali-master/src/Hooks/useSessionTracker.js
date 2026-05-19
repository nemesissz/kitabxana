import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import Base_Url_Server from '../Constants/baseUrl';
import dataContext from '../Contexts/GlobalState';

const INTERVAL = 10; // TEST: 10s (istehsalda 60 olacaq)

function getOrCreateSessionId() {
  let sid = localStorage.getItem('_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('_sid', sid);
  }
  return sid;
}

export default function useSessionTracker() {
  const store = useContext(dataContext);
  const activeRef  = useRef(document.visibilityState === 'visible');
  const elapsedRef = useRef(0);
  const userIdRef  = useRef(null);
  const timerRef   = useRef(null);

  // user dəyişdikdə ref-i yenilə və yeni session ID yarat
  useEffect(() => {
    const newId = store?.user?.data?.id || null;
    if (newId !== userIdRef.current) {
      // Fərqli istifadəçi — köhnə sessionu bağla, yeni başlat
      sendHeartbeat(elapsedRef.current);
      elapsedRef.current = 0;
      localStorage.removeItem('_sid');
    }
    userIdRef.current = newId;
  }, [store?.user?.data?.id]);

  const sendHeartbeat = (delta) => {
    if (delta <= 0) return;
    axios.post(Base_Url_Server + 'sessions/heartbeat', {
      session_id: getOrCreateSessionId(),
      user_id: userIdRef.current,
      delta,
    }).catch(() => {});
  };

  useEffect(() => {
    const onVisibility = () => {
      activeRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibility);

    timerRef.current = setInterval(() => {
      if (activeRef.current) elapsedRef.current += 1;
      if (elapsedRef.current >= INTERVAL) {
        sendHeartbeat(elapsedRef.current);
        elapsedRef.current = 0;
      }
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      sendHeartbeat(elapsedRef.current);
    };
  }, []);
}
