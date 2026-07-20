# Visual Redesign v8 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v8.md` (1 баг-репорт + 4 правки).

## Investigated, not reproducible on current deploy

- **Item 0** (textarea red border on Capture open): tested live on `https://ai-day-planner-sand.vercel.app/` — `aria-invalid` is `null`, computed `border-color` is `rgb(240, 211, 196)` (`#F0D3C4`, the correct `accent-border`), not red. No code sets `aria-invalid` or `required` anywhere in the codebase; the shadcn `Textarea`'s `aria-invalid:border-destructive` variant only activates when that attribute is explicitly set, which it never is here.
- **Item 2, the "ring not showing" half**: tested live — `.animate-pulse-ring` is present, `animation-name: pulse-ring`, `animation-duration: 1.8s`, actively animating. Not a regression.

Both match the same pattern as v7 item 0 (also unreproducible) — most likely the designer is testing against a cached/stale tab. Not fixed in this plan; user will hard-refresh and re-check separately. Only the genuinely new part of item 2 (the FAB "breathing" scale animation, which never existed before) is implemented below.

## 1. Error copy

`"Не вдалося обробити, спробуй ще раз"` → `"Не вдалося розібрати текст. Спробуй ще раз"`, in both places this string is hardcoded:
- `src/components/capture-sheet.tsx` — the client-side fallback when `error instanceof Error` is false.
- `src/app/api/parse/route.ts` — the `HUMAN_ERROR` constant, which is what's actually shown for every real failure path (empty text, missing API key, invalid AI JSON, network error) since the client always throws `new Error(data.error ?? ...)` using the server's message.

## 2. FAB breathing animation (new, additive to the already-working ring)

New keyframe in `globals.css`:
```css
@keyframes fab-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
.animate-fab-breathe {
  animation: fab-breathe 1.8s ease-in-out infinite;
}
```
Applied to the FAB `<button>` in `page.tsx`, conditionally on the same `visibleTasks.length === 0` check that already gates the ring — same 1.8s rhythm, both animations run simultaneously only on the empty state, both removed the instant a task exists. The button's existing `hover:scale-105 active:scale-95` transform utilities and this keyframe both animate `transform`; since the breathing animation only runs while idle (no hover/press interaction happening at rest), there's no real conflict — a mid-breath hover/press still resolves correctly because CSS transitions and animations on the same property, the last-applied wins per the cascade, and hover/active are interaction-driven one-offs that naturally interrupt the idle loop.

## 3. Checkbox radius

`--radius-checkbox: 8px` → `4px` in the `@theme` block, `globals.css`. Single token — `TaskCard`'s checkbox (`rounded-checkbox`) picks it up automatically, no component changes needed.

## 4. Capture "Обробити" loading state — three pulsing dots

`src/components/capture-sheet.tsx`: while `status === "loading"`, the button renders three small dots instead of the "Ми будуємо твій план..." text. New keyframe:
```css
@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
```
Three `<span>` elements, each `w-1.5 h-1.5 rounded-full bg-current animate-dot-pulse`, with `animationDelay` `0ms`/`150ms`/`300ms` respectively via inline `style`. Button stays `bg-accent` (its existing background) — `disabled` already prevents double-taps via the existing `disabled={text.trim().length === 0 || status === "loading"}` condition, no new disabled-state styling needed since the button doesn't currently gray out on `disabled` (no `disabled:` variant classes in its className).

## What's untouched

Items 0 and the ring-half of item 2 — no code change (unreproducible, see above). Colors/fonts/tokens/other v1-v7 behavior — unchanged.

## Testing (manual)

1. Trigger an error (empty text is blocked client-side, so: break the API key temporarily, or submit gibberish that yields an empty AI result) — confirm the message reads "Не вдалося розібрати текст. Спробуй ще раз".
2. Empty Today — confirm both the ring (already working) and now the FAB itself gently scale up/down together, same rhythm. Add a task — confirm both stop.
3. Inspect a checkbox — corners visibly tighter (4px) than before.
4. Submit valid text in Capture — confirm the button shows three pulsing dots (not the old text) while loading, stays accent-colored, and can't be tapped again until the request resolves.
