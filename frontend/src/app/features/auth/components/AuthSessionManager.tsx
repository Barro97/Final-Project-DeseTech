import { useIdleTimer } from 'react-idle-timer';
import { useEffect } from 'react';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function AuthSessionManager() {
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        console.log('Token refreshed');
      } else {
        // Failed to refresh — logout
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      window.location.href = '/login';
    }
  };

  const handleOnActive = () => {
    console.log('User is active, refreshing token');
    refreshToken();
  };

  const handleOnIdle = () => {
    console.log('User is idle');
    // Optional: do something like show a warning
  };

  useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: handleOnIdle,
    onActive: handleOnActive,
    debounce: 500,
  });

  return null;
}
