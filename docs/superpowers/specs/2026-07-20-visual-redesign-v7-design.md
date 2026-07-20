# Visual Redesign v7 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v7.md` (1 баг-репорт + 4 точкові дизайн-правки).

## 0. Bug report — time lost through Inbox flow

Investigated before touching any code. Reproduction attempt (same input text, once via direct-add with Inbox off, once via Inbox on → "Додати все в Today") on both local dev and the live Vercel deploy (post-v6): `time: "17:00"` is preserved correctly in `localStorage` in both paths, verified via `curl` against `/api/parse` directly (deterministic across 3 calls) and via full click-through in the browser twice. **Cannot reproduce on the current codebase.** Most likely the designer's screenshots were taken against a deploy that predated the v6 push. User will do a final manual check on their own phone before this is considered closed — no code change made for this item pending that confirmation.

## 1. Tabular-nums reinforcement

`src/components/task-card.tsx`: the time `<span>` already had Tailwind's `tabular-nums` utility (`font-variant-numeric: tabular-nums`), which apparently isn't enough for Manrope in this browser/render path. Replaced with an inline `style` carrying both `fontVariantNumeric: "tabular-nums"` and the explicit `fontFeatureSettings: '"tnum" 1, "lnum" 1'` fallback, plus `letterSpacing: 0` to rule out any inherited tracking. No font swap to monospace — the reinforced CSS is tried first per the spec's own preference order.

## 2. Capture title spacing

`src/components/capture-sheet.tsx`: `DrawerTitle` gets `mb-4` (16px) added to its className, closing the "flush against textarea" gap the designer flagged.

## 3. Inbox button row

`src/components/inbox-screen.tsx`:
- Copy: "Додати все в Today" → "Додати задачі".
- Layout: the row's `gap-3` → `gap-2` (8px per spec); both buttons drop `flex-1` (equal split) for `basis-[30%] shrink-0 grow-0` (Назад) and `basis-[70%] shrink-0 grow-0` (Додати задачі) — an explicit 30/70 split, gap eating into it exactly as the spec acknowledges.

## 4. Delayed card removal on completion

`src/app/page.tsx` gains two new pieces of transient state: `completingIds: Set<string>` and `fadingIds: Set<string>`. `handleComplete(id)`:
1. Sets `task.done = true` immediately (checkbox fills via existing `checked:` styles, title gets strikethrough via existing `task.done` styling) and adds `id` to `completingIds` — the card stays in `visibleTasks` because the filter becomes `!task.done || completingIds.has(task.id)`, not just `!task.done`.
2. After 1000ms: adds `id` to `fadingIds`. `TaskCard` receives a new `fading` prop; when true, the card's className includes `opacity-0` with the existing transition already covering `opacity` (extended from just `transform`), so it fades over the transition's duration (bumped to 150ms to match the spec).
3. After another 150ms (1150ms total, ~1.2s as the spec asks): `id` is removed from both `completingIds` and `fadingIds` (now genuinely filtered out), and this is the point the undo toast logic fires (same single-active-undo behavior as before, just relocated to this later moment instead of firing immediately on tap).

`handleUndo` is unchanged — by the time it could run, `completingIds`/`fadingIds` no longer reference the task, so reverting `done: false` just makes it reappear normally through the existing render path.

## What's untouched

Colors/fonts/tokens/checkbox-as-priority/Inbox trigger+popover from v1-v6 — unchanged. Sort/soft-complete-toast *logic* (only its timing) — unchanged.

## Testing (manual)

1. Add a task with an explicit time (e.g. "15:00") — inspect the rendered digits for equal spacing (devtools: check computed `font-feature-settings` on the time span).
2. Open Capture — confirm visible 16px gap between "Що в голові?" and the textarea.
3. Enable Inbox, submit text, confirm the bottom button row reads "Назад" / "Додати задачі" with the narrow/wide proportions visually obvious (not a 50/50 split).
4. Tap a Today checkbox — confirm: checkbox fills and title strikes through immediately, card stays fully visible and interactive for about 1 second, then visibly fades out (not an instant cut) over ~150ms, then the undo toast appears.
5. Tap "Скасувати" during the 1-second visible window (before it starts fading) — confirms undo still works from mid-delay, not just after the toast appears.
6. Repeat the bug-0 repro (time through Inbox) on a real phone — confirm still fine live.
