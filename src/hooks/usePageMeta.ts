import { useEffect } from 'react';

const SITE = 'Lokka';
const DEFAULT_IMAGE = '/og-image.png';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/**
 * Per-page <title>, description and social tags. Keep titles under 60 characters and
 * descriptions under 155 (search engines cut longer ones). The canonical URL and og:url
 * are kept in sync by CanonicalTag.
 */
export function usePageMeta(title: string | undefined, description: string | undefined, image?: string | null) {
  useEffect(() => {
    if (!title) return;
    const full = title.includes(SITE) ? title : `${title} · ${SITE}`;
    document.title = full;
    setMeta('property', 'og:title', full);
    setMeta('name', 'twitter:title', full);
    if (description) {
      const desc = description.length > 155 ? `${description.slice(0, 154).trimEnd()}…` : description;
      setMeta('name', 'description', desc);
      setMeta('property', 'og:description', desc);
      setMeta('name', 'twitter:description', desc);
    }
    const img = new URL(image || DEFAULT_IMAGE, window.location.origin).href;
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:image', img);
  }, [title, description, image]);
}
