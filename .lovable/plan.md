## Goal

`--primary` resolves to navy, which has ~1.3–1.7:1 contrast on the near-black background. Every use of `text-primary` / `border-primary` / `hover:text-primary` / `hover:border-primary` as a foreground/icon/border color directly against a dark surface must move to `gold`. Solid `bg-primary` filled surfaces paired with `text-primary-foreground` stay as-is (correct navy fill + cream text, 12.8:1).

## Rule applied per instance

- Foreground text / icon / border on dark surface → swap `primary` → `gold`
  - `text-primary` → `text-gold`
  - `border-primary` → `border-gold` (including `/40`, `/30` opacity variants)
  - `hover:text-primary` → `hover:text-gold`
  - `hover:border-primary` → `hover:border-gold`
  - `bg-primary/15` / `bg-primary/10` / `bg-primary/5` tint chips (still effectively foreground-tinted on dark) → `bg-gold/15` etc.
- Solid fill + cream text pairs → **leave unchanged**: `bg-primary text-primary-foreground`, `data-[state=checked]:bg-primary`, `SliderPrimitive.Range bg-primary`, switch checked state, calendar selected day, badge default variant, sonner action button, Register/Login/Footer logo squares, EventsSlider active dot, Events page category badge, CartDrawer count bubble, Messages sent bubble, Marketplace active category chip, DashboardLayout active nav border+bg pair.

## Files to edit (foreground/border cases only)

Product / marketplace:
- `src/pages/Search.tsx` (lines 104, 135, 141): hover border, price, "View profile →"
- `src/components/marketplace/CoachCard.tsx` (13, 66, 72): hover border, price, view link
- `src/components/marketplace/ProductCard.tsx` (9, 30, 37): hover border, verified check icon, price
- `src/components/marketplace/CartDrawer.tsx` (46, 55): item price, subtotal (keep 26 count bubble)
- `src/pages/Events.tsx` (25): hover border (keep 39 filled badge)
- `src/pages/ClubProfile.tsx` (128): price

Coach profile:
- `src/pages/CoachProfile.tsx` (179, 220, 232, 243, 251): sport tag chip (`bg-primary/15 text-primary` → `bg-gold/15 text-gold`), cert border+text, calendar icon, slot hover border, request price

Dashboard:
- `src/pages/dashboard/Availability.tsx` (105, 124): icon, open-status border+text
- `src/pages/dashboard/BookingRequests.tsx` (122): confirmed status border+text
- `src/pages/dashboard/MyBookings.tsx` (84): confirmed status border+text
- `src/pages/dashboard/Analytics.tsx` (24, 26, 37): icons + emphasized stat number
- `src/pages/dashboard/DashboardHome.tsx` (84, 147, 160, 166): stat icons, completion %, checklist done icon
- `src/pages/dashboard/ProfileEditor.tsx` (146, 149, 157, 269): unverified border + icons + discount % number
- `src/pages/dashboard/Billing.tsx` (47, 48, 59, and any further `text-primary` past truncation): highlight surface border/tint, sparkles + crown icons
- `src/pages/dashboard/Messages.tsx` (145 only — `bg-primary/10` active conversation tint on dark → `bg-gold/10`; keep 183/187 sent bubble as filled navy)

Auth / nav / misc:
- `src/pages/Login.tsx` (76): "Create an account" link
- `src/pages/Register.tsx` (225): "Login" link
- `src/pages/NotFound.tsx` (16): home link
- `src/components/home/FeatureTicker.tsx` (20): diamond glyph
- `src/components/dashboard/DashboardLayout.tsx` (66): active nav — **special case**: `border-primary bg-background-secondary text-foreground` is a left-border indicator against a surface fill, not a solid navy button. Swap `border-primary` → `border-gold`.

Shadcn primitives (rendered on dark bg as outlines/borders):
- `src/components/ui/button.tsx` (17): outline variant `hover:border-primary hover:text-foreground` → `hover:border-gold`
- `src/components/ui/radio-group.tsx` (23): `border-primary text-primary` outer ring → `border-gold text-gold` (checked indicator dot stays default)
- `src/components/ui/checkbox.tsx` (14): unchecked `border-primary` → `border-gold`; keep `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground` (filled navy on check — correct)
- `src/components/ui/slider.tsx` (18): thumb `border-primary` (empty ring on dark) → `border-gold`; keep Range `bg-primary` fill
- `src/components/ui/calendar.tsx` (35): keep — this is the selected-day filled pill (`bg-primary text-primary-foreground` pair)

Left unchanged (verified filled pairs): `PublicNav`, `PublicFooter`, `Register`/`Login` logo squares, `FloatingCartButton`, `EventsSlider` active dot, `Events` category badge, `CartDrawer` count badge, `Community` disabled/register buttons, `CampCard`/`CampDetail` book buttons, `Marketplace` active category chip, `Messages` sent bubble, `ui/badge` default variant, `ui/sonner` action button, `ui/switch` checked state, `DashboardLayout` active bg.

## Verification

1. After edits, re-run `rg "\b(text-primary|border-primary|hover:text-primary|hover:border-primary|bg-primary/(5|10|15|20|30|40))\b" src/` and confirm each remaining hit is a documented filled-pair exception.
2. Run `bunx tsgo --noEmit` and confirm zero errors.
3. Report the full changed-file list with a one-line note per file.
