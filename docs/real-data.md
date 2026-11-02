# Real data: events, camps and clubs

Everything a visitor sees about events, camps and clubs comes from the database. There is no sample data on the site.

## Where it lives

| What | Table | Public can see |
|---|---|---|
| Events and camps (`kind = 'camp'`) | `events` | `published` rows that have not ended |
| Clubs that have not joined yet | `club_listings` | `published` rows |
| Clubs that joined | `club_profiles` | `approved` rows (unchanged) |
| Claims on a listing | `club_claims` | only the club that filed it, and admins |
| "Something is wrong / remove this" | `listing_reports` | anyone can file, only admins read |

Admins work in `/admin/events` and `/admin/clubs`. Every import and review is written to `admin_audit_log`.

## Adding data

1. Download the template from the Import box, fill it in a spreadsheet, export as CSV (comma or semicolon both work).
2. Press **Check**. Nothing is saved; you see how many rows are new, how many update an existing row, and every problem.
3. When the check is clean, press **Import**. Rows arrive as `draft` unless the `status` column says otherwise.
4. Open the draft rows, look at them, then **Publish drafts**.

To correct something, import the row again with the same `slug`. A blank `status` keeps the current one.

## Event columns

`title`, `kind` (race, tournament, open_day, clinic, workshop, camp), `sport` (a slug from `src/lib/mockData.ts`, e.g. padel, running), `starts_on` and `ends_on` (`YYYY-MM-DD`), `recurrence` (free text), `venue`, `district`, `address`, `lat`, `lng`, `price_text`, `level`, `age_group`, `registration_url`, **`source_url` (required)**, `source_name`, `summary` (your own words, max 400 characters), `organiser_name`, `status`, `slug` (made from title and date if empty).

## Club columns

`name`, `sports` (separated by `;`, e.g. `padel;tennis`), `city` (default Sofia), `district`, `address`, `lat`, `lng`, `website`, `source_name`, `source_url`, `osm_id`, `status`, `slug`.

## Rules for every row

- Facts and links only: name, date, place, price, link. Write the summary yourself. Do not copy descriptions, photos, ratings or reviews.
- Every row needs a source link a person can open. Use the organiser's own page whenever possible.
- No phone numbers or personal emails. Clubs are listed by name, address and website.
- Do not copy from Google Maps/Places, Facebook or Playtomic (their terms forbid it). OpenStreetMap data is fine as a starting list: keep "© OpenStreetMap contributors" visible (it is on every listing page).
- When a club or organiser asks for removal, set the row to `removed` (listings) or `cancelled`/delete (events) the same day, then mark the report as handled.
- Use the tick button on a row to mark "checked today". Rows not checked for 30 days (events) or 90 days (clubs) show as stale.

## Making the first clubs draft (OpenStreetMap)

```bash
python3 scripts/osm_fetch.py          # downloads sports venues in Sofia into data/drafts/ (public servers are often busy; it retries)
python3 scripts/build_clubs_draft.py  # filters, removes duplicates and non-clubs, looks up districts, writes data/drafts/clubs_sofia_draft.csv
```

Rules the script applies: named venues only; needs a website or a street address; no pitches, shops, stadiums, malls or event sites; one row per business (branches kept only when each has its own address); phone numbers are never copied. Rows are ranked A (website, address and sport all present) or B. `data/drafts/` is not committed.

Events are drafted by hand. Listing sites such as racecalendar.bg (about 2,600 Bulgarian races) are used only to find races and their organisers. They say themselves that their dates are not official, and one disagreed with the organiser (Plovdiv Run: 17 April on the list, 16-18 April on the organiser's site). So a date goes in only when the organiser's own page shows it, and `source_url` is that page, never the listing. Races whose organiser has only a Facebook page, or whose page cannot be read, stay in the watch-list. Do not copy a listing site's pages or automate against them without reading their terms.

## Migration

`supabase/migrations/20261103100000_events_and_club_listings.sql`. Applied to the live database through the Lovable DB tool with a rolled-back test first (dry run, upsert without duplicates, anon sees only published upcoming rows, non-admins refused, claim flow, reports).
