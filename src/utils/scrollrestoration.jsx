// ScrollRestoration.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    // Restore scroll position for the current path
    const savedPosition = sessionStorage.getItem(currentPath);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }

    // Save scroll position on beforeunload
    const saveScrollPosition = () => {
      sessionStorage.setItem(currentPath, window.scrollY);
    };

    window.addEventListener('beforeunload', saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location]);

  return null;
};

export default ScrollRestoration;
