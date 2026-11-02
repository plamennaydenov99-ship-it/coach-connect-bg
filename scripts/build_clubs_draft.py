#!/usr/bin/env python3
"""Turn data/drafts/osm_sofia_raw.json into data/drafts/clubs_sofia_draft.csv, ready for /admin/clubs.
Facts only: name, address, sports, website. Phone numbers are deliberately left out.
Districts come from Nominatim (1 request per second, cached in data/drafts/district_cache.json).
Data © OpenStreetMap contributors, ODbL."""
import csv, json, math, pathlib, re, sys, time, urllib.parse, urllib.request, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'drafts'
RAW, CACHE, OUT = ROOT / 'osm_sofia_raw.json', ROOT / 'district_cache.json', ROOT / 'clubs_sofia_draft.csv'
UA = 'lokka-data-draft/0.1 (plamen@enflux.io)'
COLUMNS = ['name', 'sports', 'city', 'district', 'address', 'lat', 'lng', 'website', 'source_name', 'source_url', 'osm_id', 'status', 'slug', 'priority', 'check_note']

# Not clubs a coach would work from: stadiums, arenas, a mall, a karting track, a medical spa, a school, or an event site.
EXCLUDE = ('arena 8888', 'vasil levski national stadium', 'vivacom arena', 'lokomotiv stadium', 'universiada hall', 'benkovski kart', 'carve',
           'приключенски парк', 'витоша 100', 'lyulin plaza', 'спа медик', 'national sports academy', 'x body push', 'strong strategy', 'r5')
# Websites that are not the club's own (a property listing, a marketing-funnel tool).
JUNK_DOMAINS = ('effectivefunnels.com', 'byouteeq.com')
SOCIAL = ('facebook.com', 'instagram.com', 'youtube.com')

def host(url):
    return re.sub(r'^www\.', '', re.sub(r'^https?://', '', url.lower()).split('/')[0]) if url else ''

BG = dict(zip('абвгдежзийклмнопрстуфхцчшщъьюя', ['a','b','v','g','d','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sht','a','y','yu','ya']))
def slugify(s):
    s = ''.join(BG.get(c, c) for c in s.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:70]

SPORT_MAP = {'soccer': 'football', 'football': 'football', 'futsal': 'football', 'yoga': 'yoga', 'tennis': 'tennis', 'padel': 'padel',
    'swimming': 'swimming', 'boxing': 'boxing', 'kickboxing': 'boxing', 'climbing': 'climbing', 'pilates': 'pilates', 'basketball': 'basketball',
    'volleyball': 'volleyball', 'cycling': 'cycling', 'running': 'running', 'crossfit': 'crossfit', 'gymnastics': 'gymnastics', 'fencing': 'fencing',
    'karate': 'karate', 'judo': 'judo', 'taekwondo': 'taekwondo', 'aikido': 'aikido', 'martial_arts': 'martial-arts', 'fitness': 'fitness',
    'gym': 'fitness', 'weightlifting': 'fitness', 'calisthenics': 'fitness', 'bjj': 'bjj'}

def sports_of(tags):
    out = []
    for tok in re.split(r'[;,]', tags.get('sport', '')):
        s = SPORT_MAP.get(tok.strip().lower())
        if s and s not in out: out.append(s)
    return out

def dist_m(a, b):
    p = math.pi / 180
    x = (b[1] - a[1]) * p * math.cos((a[0] + b[0]) / 2 * p); y = (b[0] - a[0]) * p
    return 6371000 * math.hypot(x, y)

def district_of(lat, lng, cache):
    key = f'{lat:.4f},{lng:.4f}'
    if key in cache: return cache[key]
    url = 'https://nominatim.openstreetmap.org/reverse?' + urllib.parse.urlencode({'format': 'jsonv2', 'lat': lat, 'lon': lng, 'zoom': 16, 'addressdetails': 1, 'accept-language': 'en'})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as r:
            a = json.load(r).get('address', {})
        d = re.sub(r'\s+District$', '', a.get('county', '') or '')
        d = d if d and 'Sofia' not in d and 'Stolichna' not in d else ''
    except Exception as e:
        print('lookup failed', key, e, file=sys.stderr); return ''
    cache[key] = d
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))
    time.sleep(1.1)
    return d

def main():
    raw = json.loads(RAW.read_text())['elements']
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    cands = []
    for e in raw:
        t = e.get('tags', {})
        name = (t.get('name:en') or t.get('name') or '').strip()
        if not name or t.get('leisure') == 'pitch' or 'shop' in t: continue
        lat, lng = (e.get('lat'), e.get('lon')) if 'lat' in e else ((e.get('center') or {}).get('lat'), (e.get('center') or {}).get('lon'))
        if lat is None: continue
        site = (t.get('website') or t.get('contact:website') or '').split(';')[0].strip()
        if site and not re.match(r'https?://', site): site = 'https://' + site
        if '/shop/' in site or any(j in site for j in JUNK_DOMAINS): site = '' if any(j in site for j in JUNK_DOMAINS) else site
        if '/shop/' in site: continue
        if name.lower().startswith(EXCLUDE): continue
        street, num = t.get('addr:street', '').strip(), t.get('addr:housenumber', '').strip()
        address = f'{street} {num}'.strip() if street and num else ''
        if not (site or address): continue  # nothing a visitor or a coach could use
        cands.append(dict(el=e, t=t, name=name, lat=lat, lng=lng, site=site, address=address, sports=sports_of(t)))

    # drop the same place entered twice (same name, under 150 m apart), keep the one with a website
    cands.sort(key=lambda c: (not c['site'], c['name'].lower()))
    kept = []
    for c in cands:
        if any(k['name'].lower() == c['name'].lower() and dist_m((k['lat'], k['lng']), (c['lat'], c['lng'])) < 150 for k in kept): continue
        kept.append(c)
    # one row per business: for each website keep the entries that have their own street address, or just one if none do
    by_host = collections.defaultdict(list)
    for c in kept: by_host[host(c['site']) if c['site'] and not any(x in c['site'] for x in SOCIAL) else f"id:{id(c)}"].append(c)
    merged = []
    for group in by_host.values():
        withaddr, seen = [c for c in group if c['address']], set()
        for c in withaddr:
            if c['address'].lower() not in seen: seen.add(c['address'].lower()); merged.append(c)
        if not withaddr: merged.append(group[0])
    # the same name in the same district, none with an address, is the same place entered twice
    kept, seen = [], set()
    for c in sorted(merged, key=lambda c: (not c['address'], not c['site'], c['name'].lower())):
        key = (c['name'].lower(), c['address'].lower()) if c['address'] else (c['name'].lower(), round(c['lat'], 2), round(c['lng'], 2))
        if key in seen: continue
        seen.add(key); kept.append(c)
    # a copy without an address is dropped when the same name already has a row with an address or an earlier copy
    named_with_addr = {c['name'].lower() for c in kept if c['address']}
    seen_noaddr, pruned = set(), []
    for c in kept:
        n = c['name'].lower()
        if not c['address']:
            if n in named_with_addr or n in seen_noaddr: continue
            seen_noaddr.add(n)
        pruned.append(c)
    kept = pruned
    chain = collections.Counter(c['name'].lower() for c in kept)
    print(f'{len(raw)} raw, {len(cands)} usable, {len(kept)} after removing duplicates; looking up districts ...')

    rows, slugs = [], set()
    for c in kept:
        t = c['t']
        sports = c['sports'] or (['fitness'] if t.get('leisure') == 'fitness_centre' else [])
        district = district_of(c['lat'], c['lng'], cache)
        base = slugify(f"{c['name']} {district}".strip()) or 'club'
        slug, n = base, 2
        while slug in slugs: slug, n = f'{base}-{n}', n + 1
        slugs.add(slug)
        notes = []
        if not c['sports']: notes.append('Sport guessed as fitness from the OpenStreetMap type: confirm.' if sports else 'Type unclear (no sport in OpenStreetMap): open the website and set the sport, or delete the row.')
        if not c['site']: notes.append('No website in OpenStreetMap.')
        elif any(x in c['site'] for x in SOCIAL): notes.append('Website is a social page: use the club\'s own site if it has one.')
        if not c['address']: notes.append('No street address in OpenStreetMap: add it from the club\'s website.')
        if chain[c['name'].lower()] > 1: notes.append('Same name appears more than once (a chain?): check this is a separate location.')
        osm = f"{c['el']['type']}/{c['el']['id']}"
        rows.append({'name': c['name'], 'sports': ';'.join(sports), 'city': 'Sofia', 'district': district, 'address': c['address'], 'lat': f"{c['lat']:.5f}", 'lng': f"{c['lng']:.5f}",
                     'website': c['site'], 'source_name': 'OpenStreetMap', 'source_url': f'https://www.openstreetmap.org/{osm}', 'osm_id': osm, 'status': 'draft', 'slug': slug,
                     'priority': 'A' if (c['site'] and not any(x in c['site'] for x in SOCIAL) and c['address'] and sports) else 'B', 'check_note': ' '.join(notes)})

    # clubs confirmed from other sources and missing from OpenStreetMap
    rows.append({'name': 'Padel Club Sofia', 'sports': 'padel', 'city': 'Sofia', 'district': '', 'address': 'Okolovrasten put 72', 'lat': '', 'lng': '', 'website': '',
                 'source_name': 'FIP calendar listing', 'source_url': 'https://www.padelfip.com/?p=261662', 'osm_id': '', 'status': 'draft', 'slug': 'padel-club-sofia', 'priority': 'B',
                 'check_note': 'Added by hand: host of the FIP Bronze Sofia padel tournament (Oct 2025), indoor, 5 match courts per FIP. Find the club\'s own website and district, then publish.'})
    rows.sort(key=lambda r: (r['priority'], r['sports'].split(';')[0] if r['sports'] else '~', r['name'].lower()))
    with OUT.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS); w.writeheader(); w.writerows(rows)
    print(f'wrote {len(rows)} rows to {OUT}')

if __name__ == '__main__':
    main()
