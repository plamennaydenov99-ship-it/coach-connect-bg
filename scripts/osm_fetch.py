#!/usr/bin/env python3
"""Download sports venues in Sofia from OpenStreetMap (Overpass) into data/drafts/osm_sofia_raw.json.
Public Overpass servers are often busy, so this tries several and waits between attempts.
Data © OpenStreetMap contributors, ODbL."""
import json, sys, time, urllib.parse, urllib.request, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'drafts' / 'osm_sofia_raw.json'
SERVERS = ['https://z.overpass-api.de/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter',
           'https://overpass.openstreetmap.fr/api/interpreter', 'https://overpass-api.de/api/interpreter']
BBOX = '42.60,23.17,42.78,23.50'  # Sofia city
SPORTS = 'padel|tennis|boxing|yoga|martial_arts|karate|judo|taekwondo|swimming|climbing|crossfit|gymnastics|fencing|basketball|volleyball|soccer|futsal|running|cycling|pilates|aikido|kickboxing'
QUERY = f'''[out:json][timeout:90];
(nwr["leisure"~"^(sports_centre|fitness_centre)$"]({BBOX});
 nwr["sport"~"{SPORTS}"]["name"]({BBOX}););
out center tags 2500;'''

def main():
    data = urllib.parse.urlencode({'data': QUERY}).encode()
    for attempt in range(3):
        for url in SERVERS:
            try:
                req = urllib.request.Request(url, data=data, headers={'User-Agent': 'lokka-data-draft/0.1 (plamen@enflux.io)'})
                with urllib.request.urlopen(req, timeout=100) as r:
                    body = r.read()
                parsed = json.loads(body)
                OUT.parent.mkdir(parents=True, exist_ok=True)
                OUT.write_bytes(body)
                print(f'ok: {len(parsed.get("elements", []))} elements from {url}')
                return 0
            except Exception as e:  # busy server, timeout, bad JSON: try the next one
                print(f'failed {url}: {e}', file=sys.stderr)
                time.sleep(5)
        time.sleep(20)
    print('all servers failed', file=sys.stderr)
    return 1

if __name__ == '__main__':
    sys.exit(main())
