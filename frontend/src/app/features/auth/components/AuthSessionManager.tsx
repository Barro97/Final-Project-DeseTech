import { useIdleTimer } from 'react-idle-timer';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

//the idea here is to refresh the token if the user is active and if idle then to not refresh token and allow the exp time to run out.
export default function AuthSessionManager() {
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/auth/refresh`, {
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

  // check every 30 seconds if the token is expired and delete it.
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const decoded: { exp: number } = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.exp < currentTime) {
          console.log('Token expired — logging out');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    };

    const interval = setInterval(checkTokenExpiration, 30 * 1000); // every 30 seconds
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return null;
}
