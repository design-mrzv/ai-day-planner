# Visual Redesign v10 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v10.md`.

## 1. Compact undo-toast next to the FAB

`src/components/undo-toast.tsx` rewritten as a fit-content pill (undo icon + "Скасувати" / "Задачу виконано"), `bg-[#1C1815]`, `rounded-[16px]`, `px-3.5 py-2.5`. `src/app/page.tsx`'s bottom-right cluster becomes a `flex items-center gap-2.5` row: the toast (when present) on the left, the FAB (wrapped in its own `relative h-14 w-14` div so the pulse ring still sizes to just the button) on the right.

## 2. Full pill radius on every button

`capture-sheet.tsx`'s "Обробити" and `welcome-screen.tsx`'s "Почати": `rounded-input` → `rounded-full`. Inbox's "Назад"/"Додати задачі" are already `rounded-full` — no change. Cards and sheet containers are not buttons and keep their existing radius.

## What's untouched

Colors/fonts/v9 logo+illustration/everything else from v1-v9 — unchanged.

## Testing (manual)

1. Complete a task — undo pill appears immediately left of the FAB, not a full-width bar; tapping it still undoes, still auto-dismisses after 4s.
2. "Обробити" and "Почати" now fully rounded (pill), matching Inbox's buttons.
