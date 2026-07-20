# Visual Redesign v6 — Inbox: pills → trigger + popover

> Джерело вимог: designer's `DESIGN_SPEC_v6.md` + working prototype `inbox_dropdown_prototype.html`.
> Заміняє тільки Inbox-картку (`src/components/inbox-screen.tsx`). Today/Capture/кольори/шрифти — без змін.

## Resolved discrepancy (confirmed with user)

v6 says delete goes from "⋮" to "✕" "per a prior decision" — no such decision exists in this project's history; the post-audit phase explicitly chose "⋮" + dropdown with "Видалити задачу". Confirmed with the user: switch to "✕" now, per v6/the prototype.

## Architecture

Reuse the existing `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem` (shadcn, `@base-ui/react`-backed, already in the project from the post-audit Inbox-delete work) instead of hand-rolling the prototype's raw `toggle()`/`closeAll()`/outside-click JS. This gets the required behaviors for free: content renders in a Portal (so it isn't clipped by the trigger row's `overflow-x-auto`), auto-flip up/down on collision, close-on-outside-click, and only one open at a time.

Three independent `DropdownMenu` instances per card — Priority, Category (label), Deadline — each wrapped in a labeled `trigger-group`. `onChangeTask(index, patch)` (existing prop, unchanged signature) fires on item click, same as the old pills. `onDeleteTask(index)` (existing prop, unchanged) fires from the new "✕" button instead of the old dropdown's delete item.

## Card layout

- Title row: text input (unchanged) + circular "✕" button (36×36 visual, 44×44 tap target via the same invisible-padding pattern used elsewhere in this codebase), replacing the "⋮" `DropdownMenuTrigger`.
- Trigger row: `flex flex-nowrap gap-2 overflow-x-auto pr-6` (no `flex-wrap`), `scrollbar-width: none` / `[&::-webkit-scrollbar]:hidden`, so it scrolls horizontally instead of wrapping to a second line. Each `trigger-group` is `flex-shrink-0`.
- Each trigger group: a small uppercase field label (`text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-1`) above a pill button.
- Trigger button (`DropdownMenuTrigger`): pill shape (`rounded-full border border-[#EDE6DD] bg-white px-3 py-2`), content left-to-right: 14px icon (colored per current value) → current value text (`text-sm font-medium text-text-primary`) → 12px chevron-down (`text-text-tertiary`). `active:scale-[0.97]` for the press state.
- Popover (`DropdownMenuContent`): each `DropdownMenuItem` shows icon + label + a checkmark on the right when it's the currently-selected value (checkmark hidden otherwise, not removed — keeps consistent item height).

## Icons and colors (match Today's existing semantic colors)

- Priority: lucide `Flag`, `fill` and `stroke` both set to the value's color — `#EF4444`/`#F59E0B`/`#A39B92` (high/medium/low) — filled style per the prototype, distinct from Today's outline-only icons since this is Inbox-specific.
- Category (label): lucide `Tag`, stroke-only, `#3B82F6` (work) / `#22C55E` (personal).
- Deadline: lucide `Calendar`, stroke-only, always `text-text-secondary` (`#7A7069`) — neutral, no semantic color, for both "Сьогодні" and "Завтра".

## What's untouched

"Назад"/"Додати все в Today" buttons, title-input editability, AI-predetermined values as initial state — all unchanged. Today, Capture, Settings, WelcomeScreen, colors/fonts/spacing/motion from v2-v5 — unchanged.

## Testing (manual)

1. Enable Inbox, submit text with 2+ tasks — Inbox card shows three trigger pills in one row per card, each with an icon, current value, and chevron.
2. Scroll the trigger row horizontally on a narrow viewport — confirms it doesn't wrap to a second line, and the row visibly continues past the edge (not clipped exactly at the container boundary).
3. Tap the Priority trigger — popover opens below it (or above, if there's no room below) with 3 options, current one checked. Tap a different option — trigger updates immediately (icon color + text), popover closes, no confirm step needed.
4. Open the Priority popover, then tap the Category trigger without closing the first — confirm the Priority popover closes automatically (only one open at a time).
5. Tap outside any open popover — it closes without changing the value.
6. Tap "✕" on a card — it's removed immediately, no confirmation dialog, remaining cards unaffected.
7. Confirm the delete tap target feels comfortably tappable (44×44), not just the visible 36×36 circle.
