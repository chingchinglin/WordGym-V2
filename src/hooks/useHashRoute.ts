import { useState, useEffect } from 'react';

/**
 * Custom hook for hash-based routing
 */
export const useHashRoute = () => {
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash || "#/");
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const push = (h: string) => {
    if (h !== window.location.hash) {
      window.location.hash = h;
      window.scrollTo(0, 0);
    }
  };

  return { hash, push };
};
