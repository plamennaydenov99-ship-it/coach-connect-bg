const BG: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
};

/** A web-safe slug. Bulgarian letters are transliterated, so "Софийски маратон" becomes "sofiyski-maraton". */
export function slugify(s: string): string {
  return [...s.toLowerCase()].map(ch => BG[ch] ?? ch).join('')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

export const eventSlug = (title: string, startsOn: string) => `${slugify(title) || 'event'}-${startsOn}`;
export const clubSlug = (name: string, district?: string) => slugify(district ? `${name} ${district}` : name) || 'club';
export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
