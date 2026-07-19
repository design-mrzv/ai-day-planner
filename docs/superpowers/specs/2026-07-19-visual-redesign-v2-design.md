# Visual Redesign v2 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v2.md` (redesign-skill audit fix) + `design_mockup_v2.html` (pixel/color reference) + `DESIGN_SPEC.md` (v1, still valid for spacing scale, semantic colors, component logic per v2 §0).
> Дедлайн: 22.07.2026 12:00.
> Scope: full v2 — colors, fonts, radius, shadows, all interactive states (hover/press/spring), stagger animation, noise overlay. Applied across every screen, not just the two shown in the mockup.

## Resolved ambiguities (confirmed with user)

- **Capture sheet copy:** the mockup wins over v2 §8's "only 2 lines change" claim. Textarea placeholder becomes "Пиши все підряд, ми в цьому розберемось...", and a new hint line replaces the old one: "AI визначить пріоритет, час і категорію сам".
- **Empty state:** stays the 📝 emoji, per v1 §5's explicit decision. `empty_state_illustration.svg` in the designer's output folder is unused — it predates that decision and isn't referenced by v2.
- **Task completion animation:** v1 §4 asked for a 150ms fade-out before a completed task disappears. This contradicts the already-implemented, already-designer-approved soft-complete behavior ("зникає одразу, без анімації вильоту, просто filter" from the post-audit UX_FIXES.md). Kept as-is: instant removal, no fade-out. The undo toast alone provides the completion feedback.
- **Dark mode:** the mockup and both DESIGN_SPEC docs show only one (light, warm) palette. Existing `dark:` variants are removed everywhere they'd conflict with the new tokens — this app now has a single warm light theme, not light+dark.

## Architecture

**Fonts.** `next/font/google` in `src/app/layout.tsx`: `Unbounded` (weight 600/700, for H1/H2) and `Manrope` (weight 400/500/600, everything else), replacing the current Geist Sans/Mono. Exposed as CSS variables (`--font-unbounded`, `--font-manrope`) and wired into `@theme inline` as `--font-heading` / `--font-sans`.

**Color tokens.** New `@theme` block in `src/app/globals.css` (replacing the Phase-4 `priority-*`/`label-*` alias block and removing the shadcn zinc-based `@theme inline` background/foreground tokens that would conflict):
```
--color-bg-base: #FAF7F2
--color-surface: #FFFFFF
--color-text-primary: #1C1815
--color-text-secondary: #7A7069
--color-text-tertiary: #B0A79E
--color-accent: #B5502F
--color-accent-hover: #96401F
--color-accent-tint: #FBEDE7
--color-accent-border: #F0D3C4
--color-priority-high: #EF4444
--color-priority-medium: #F59E0B
--color-priority-low: #A39B92
--color-label-work: #3B82F6 / --color-label-work-bg: #E4EEFC
--color-label-personal: #22C55E / --color-label-personal-bg: #E4F6E9
```
These generate `bg-*`/`text-*`/`border-*` utilities directly (e.g. `bg-accent`, `text-text-secondary`).

**Radius tokens:** `--radius-card: 24px`, `--radius-input: 16px`, `--radius-checkbox: 8px` (pills stay `rounded-full`).

**Shadows:** CSS custom properties (not Tailwind arbitrary values, since they're tinted rgba, not grayscale) — `--shadow-fab: 0 10px 24px rgba(181,80,47,0.35)`, `--shadow-sheet: 0 -12px 40px rgba(28,24,21,0.18)`, `--shadow-toast: 0 14px 34px rgba(28,24,21,0.28)`.

**Noise overlay.** Inline SVG feTurbulence data-URI as a `body::after` pseudo-element in `globals.css`, `opacity: 0.03`, `mix-blend-mode: multiply`, `pointer-events: none`, `position: fixed; inset: 0` — matches the mockup's `.phone::after` treatment applied to the real viewport instead of a mockup frame.

**Motion — no new dependencies, plain CSS:**
- `@keyframes cardIn` (opacity 0→1, translateY 8px→0, 320ms `cubic-bezier(.34,1.56,.64,1)`) applied to each `TaskCard`; `page.tsx` passes an inline `style={{ animationDelay: \`${index * 40}ms\` }}` per card for the stagger.
- `@keyframes toastIn` on `UndoToast`, same spring easing.
- `@keyframes pulseRing` for the FAB's idle-state ring (replaces the current `animate-pulse` utility): a second absolutely-positioned `accent-tint` circle behind the FAB, `scale(1)→scale(1.55)`, `opacity .55→0`, `1.8s infinite`.
- `@keyframes checkboxPop` (scale 0→1.15→1, 220ms) triggered via a CSS class added on check (not a JS animation library).
- Hover/press: Tailwind `hover:scale-105 active:scale-95` (FAB), `active:scale-98` + `active:bg-accent-hover` ("Обробити"), `active:scale-99` (task card), all with `transition-transform duration-150` using the spring easing where the mockup specifies it.

## Component-by-component changes

- `layout.tsx` — font setup, noise overlay hookup (via a class on `<body>`), warm background.
- `globals.css` — full token replacement described above.
- `page.tsx` — H1 "Сьогодні", FAB restyled (accent color, pulse-ring, hover/press), stagger delay per card, undo-toast positioning unchanged (already matches mockup's `bottom-24`/`inset-x-4` from the post-audit pass).
- `task-card.tsx` — card surface (no border/shadow, `rounded-card`, `p-[14px_16px]` per mockup), checkbox (22px, `rounded-checkbox`, 2px border `#E3DCD3`, spring animation on check), priority dot (20px per mockup, up from the post-audit 16px), tags under new label tokens.
- `capture-sheet.tsx` — new placeholder/hint copy, textarea `accent-tint` background + `accent-border`, "Обробити" active state.
- `settings-screen.tsx` — H2 "Налаштування" (copy change, not just token), card under new tokens.
- `inbox-screen.tsx` — H2 "Ось що ми знайшли" under new font, cards, pills get an `accent-tint` intermediate hover/tap state before the fully-selected state.
- `welcome-screen.tsx` — same tokens applied by extension (not shown in the mockup, but v2 §7 implies full-app application, not just the two mocked screens).
- `undo-toast.tsx` — spring entrance animation, "Скасувати" text tinted `#F0A98A` on the dark toast background (per mockup).

## Testing (manual)

1. Open `design_mockup_v2.html` and the running app side-by-side on Today and Capture — compare colors, fonts, radius, shadows.
2. Confirm stagger: task cards appear sequentially (~40ms apart), not all at once.
3. Hover/press on FAB, "Обробити", a task card — smooth scale transitions, not instant snaps.
4. Tap a checkbox — spring pop animation plays.
5. Settings/Inbox screens visually consistent with Today (same fonts/colors, not left on old tokens).
6. Contrast-check `text-secondary` (#7A7069) and `text-tertiary` (#B0A79E) against `bg-base` (#FAF7F2) — confirm secondary ≥ 4.5:1 (tertiary is for placeholders only, lower bar acceptable).
7. Real phone after deploy — final visual confirmation of colors/fonts/animations outside devtools emulation.
