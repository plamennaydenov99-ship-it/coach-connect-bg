import type { CSSProperties } from 'react';

/** The two Sofia photos in public/images, with their real size so the browser can reserve space. */
const PHOTOS = {
  'sofia-cathedral': { w: 2400, h: 1352 },
  'sofia-borisova': { w: 2400, h: 1350 },
} as const;

export type PhotoName = keyof typeof PHOTOS;

/** WebP (1200 and 2400 wide) with the original JPG as fallback. */
export const webpSet = (name: PhotoName) => `/images/${name}-1200.webp 1200w, /images/${name}.webp 2400w`;

/** CSS background with WebP first and JPG for older browsers. */
export const photoBackground = (name: PhotoName) =>
  `image-set(url(/images/${name}-1200.webp) type('image/webp'), url(/images/${name}.jpg) type('image/jpeg'))`;

export function Picture({ name, alt, className, style, eager = false, sizes = '100vw' }: {
  name: PhotoName; alt: string; className?: string; style?: CSSProperties; eager?: boolean; sizes?: string;
}) {
  const { w, h } = PHOTOS[name];
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={webpSet(name)} sizes={sizes} />
      <img
        src={`/images/${name}.jpg`}
        alt={alt}
        width={w}
        height={h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchpriority: 'high' } : {})}
        className={className}
        style={style}
      />
    </picture>
  );
}
