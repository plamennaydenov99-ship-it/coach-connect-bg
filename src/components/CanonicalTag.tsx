import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Keeps a self-referencing <link rel="canonical"> in sync with the current URL.
 * Uses the live origin so it stays correct on preview and on the final domain.
 */
export function CanonicalTag() {
  const location = useLocation();

  useEffect(() => {
    const href = `${window.location.origin}${location.pathname}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;

    let og = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!og) {
      og = document.createElement('meta');
      og.setAttribute('property', 'og:url');
      document.head.appendChild(og);
    }
    og.content = href;
  }, [location.pathname]);

  return null;
}
