
# Read-only i18n audit + Cyrillic weight investigation

## Item 2 — Why Cyrillic renders heavier

Confirmed root cause is **not** the Google Fonts subset. `src/index.css:1` requests `Barlow Condensed:wght@400;500;600;700` with Cyrillic in the URL, and Barlow Condensed ships Cyrillic glyphs for all those weights.

The real culprit is the **font stack fallback** on `.font-display` (`src/index.css:89`):

```
font-family: 'Barlow Condensed', 'Arial Narrow', 'Barlow', system-ui, sans-serif;
```

Combined with `PublicNav` nav links using `font-semibold` (weight 600). What appears to be happening for some users: while the Cyrillic subset file is still loading (or if a weight file 302's slowly), the browser paints Cyrillic characters from the next available family. `'Arial Narrow'` has no Cyrillic → falls through to `'Barlow'` (the regular-width sibling), which at weight 600 looks visibly **heavier and wider** than Barlow Condensed. Latin text meanwhile already resolved to Barlow Condensed, so English looks correct and Cyrillic looks bold. This also matches `font-display=swap` behavior: the wrong-family glyph gets painted first and never swaps if the correct-family glyph never becomes needed (glyph cache per codepoint).

**Fix (small):**
1. Drop `'Arial Narrow'` from the `.font-display` fallback — it has no Cyrillic and is the source of the heavy substitution.
2. Add `font-display: swap` explicitly via a `@font-face` override or accept that removing Arial Narrow is enough (Barlow itself has Cyrillic, so if fallback is hit, it'll still be regular weight).
3. Add `-webkit-font-smoothing: antialiased` guard and confirm no `font-synthesis` issue by setting `font-synthesis: none;` on `body` — prevents the browser from synth-embolding when it thinks a weight is missing.
4. Preload the Cyrillic subset with a `<link rel="preload" as="font" crossorigin>` in `index.html` for the two Condensed weights actually used (500, 600).

No component code needs to change for item 2.

## Item 1 — Scope of hardcoded English strings

`useLanguage()` is currently wired into only **8 files** out of ~40 with user-visible copy. Everything else is hardcoded English. The regression on "Find a Coach" is representative: `PublicNav.tsx:14` has `label: 'Find a Coach'` as a literal, even though `nav_search` exists in `translations.ts`.

Rough count of hardcoded UI strings per file (JSX text, placeholders, toasts, aria-labels — from `rg` scan):

### Tier A — high density, user-facing chrome (do first)
| File | Strings | Uses t? |
|---|---|---|
| `components/layout/PublicNav.tsx` | 2 (incl. the `label` bug) | partial |
| `components/layout/PublicFooter.tsx` | 10 | no |
| `components/dashboard/DashboardLayout.tsx` | 2 (nav labels) | no |
| `pages/Login.tsx` | 5 | no |
| `pages/Register.tsx` | 22 | no |
| `pages/Start.tsx` | 2 | no |
| `pages/NotFound.tsx` | 1 | no |

### Tier B — dashboard pages (athlete + coach)
| File | Strings |
|---|---|
| `pages/dashboard/ProfileEditor.tsx` | 24 |
| `pages/dashboard/Bookmarks.tsx` | 11 |
| `pages/dashboard/Availability.tsx` | 11 |
| `pages/dashboard/Settings.tsx` | 10 |
| `pages/dashboard/DashboardHome.tsx` | 10 |
| `pages/dashboard/PersonalInfo.tsx` | 8 |
| `pages/dashboard/Billing.tsx` | 6 |
| `pages/dashboard/MyBookings.tsx` | 5 |
| `pages/dashboard/Messages.tsx` | 4 |
| `pages/dashboard/BookingRequests.tsx` | 4 |
| `pages/dashboard/Analytics.tsx` | 3 |

### Tier C — public pages / profile / marketplace
| File | Strings |
|---|---|
| `pages/CoachProfile.tsx` | 15 |
| `pages/ClubProfile.tsx` | 15 |
| `pages/Search.tsx` | 7 |
| `pages/Events.tsx` | 1 (mostly data-driven) |
| `pages/Marketplace.tsx` | 1 |
| `components/marketplace/EventsSlider.tsx` | 5 |
| `components/marketplace/CartDrawer.tsx` | 4 |
| `components/marketplace/FloatingCartButton.tsx` | 4 |

### Tier D — home sections (mostly already translated headings, but bodies/CTAs leaking)
| File | Strings |
|---|---|
| `components/home/SplitHero.tsx` | 1 ("Find a Coach" button) |
| `components/home/HeroSection.tsx` | (hero has "Find a Coach" literal at line 45) |
| `components/home/ManifestoSection.tsx` | 2 |
| `components/home/FeaturedCoaches.tsx` | 1 |
| `components/home/ClosingCTA.tsx` | 1 |
| `components/community/PostCard.tsx` | 1 |
| `components/BookmarkButton.tsx` | 2 (toasts) |

**Total: ~34 files, ~200 hardcoded strings.** Every dashboard page is 0% translated. Every form (Login/Register/ProfileEditor/PersonalInfo/Settings) is 0% translated. Toasts, empty states, and aria-labels are 100% English everywhere.

## Recommended split

Doing all ~200 strings in a single pass is risky (translation quality suffers, huge diff, hard to review). Suggested phased plan:

- **Phase 1 (this turn, small):** Fix the Cyrillic font-weight issue in `index.css` + `index.html`. Fix the immediate `PublicNav` "Find a Coach" bug by using `t.nav_search`. Wire `DashboardLayout` nav labels through `t`. ~1 file CSS + 2 component files.
- **Phase 2:** Tier A public chrome (Footer, Login, Register, Start, NotFound). ~40 new keys × 3 languages.
- **Phase 3:** Tier C public pages (CoachProfile, ClubProfile, Search, Marketplace, marketplace components). ~50 keys × 3.
- **Phase 4:** Tier B dashboard pages (all 11 files). ~100 keys × 3.
- **Phase 5:** Tier D home leftovers + toast/aria sweep.

Each phase = one PR-sized turn, translations stay reviewable, and the app is never in a half-broken state.

## Question for you

Do you want me to:
- **(A)** Execute Phase 1 only now (font fix + nav bug + dashboard nav labels), then wait for approval before each subsequent phase?
- **(B)** Execute Phases 1 + 2 in one go, then pause?
- **(C)** Blast through all phases in one very large turn (higher risk of shallow BG/FR translations and merge pain)?

Also: for translations, should Bulgarian and French come from you inline, or would you prefer English keys first and BG/FR filled as a follow-up?
