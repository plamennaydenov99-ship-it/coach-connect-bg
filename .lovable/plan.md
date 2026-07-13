## Fix 2 residual dead-class references

Both spots use the old `coach-accent` token family that was removed in the palette swap. They currently render unstyled badges.

### 1. `src/components/community/PostCard.tsx:57` — "Tip" badge
Replace the arbitrary-value classes with the new brand utilities so a tip post gets a visible gold-on-navy chip that matches the rest of the design system:

```
bg-[hsl(var(--coach-accent))] text-[hsl(var(--coach-accent-glow))]
```
→
```
bg-navy text-gold border border-gold/40
```

### 2. `src/components/marketplace/EventsSlider.tsx:59` — event category Badge
Replace the removed tailwind color classes with equivalents on the new palette:

```
bg-coach-accent text-coach-accent-glow hover:bg-coach-accent
```
→
```
bg-navy text-gold hover:bg-navy-hover
```

### 3. Cosmetic (optional cleanup)
Update the two stale code comments so future greps stay clean:
- `src/components/home/ClosingCTA.tsx:17` — "Thin ice line top" → "Thin copper line top"
- `src/components/home/ManifestoSection.tsx:11` — "Thin ice line above" → "Thin copper line above"

### Verification
- `bunx tsgo --noEmit` (already green, must stay green)
- Re-run the residual grep and confirm zero hits for `ice|ember|ivory|accent-electric|athlete-accent|coach-accent` and the old hex values across `src/`.
