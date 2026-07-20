# Visual Redesign v4 + v5 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v4.md` (points 1-4 + open question in point 5) and `DESIGN_SPEC_v5.md` (resolves v4's open question: no new Today/Upcoming navigation, group within the existing Today screen instead).
> v1-v3 lishayutsya chynnymy (colors, fonts, checkbox-as-priority-indicator, tap targets) — this is a further visual/structural layer on top.

## How v5 modifies v4

v4 point 3 originally specified a meta-row with three items: deadline (calendar icon), time (clock icon), label (tag icon) — in that order. v5's grouping makes the deadline badge redundant for the two common cases (`today`, `tomorrow`) since section membership already conveys it, and explicitly says to remove the "Завтра" tag from cards. So the meta-row's deadline element is kept only as a fallback for the rare case of an AI-parsed specific date (`YYYY-MM-DD`) that isn't `"today"` or `"tomorrow"` — for those two literal values, `formatDeadline` returns `null` and no calendar icon renders on the card at all.

## 1. Remove the date under "Сьогодні"

`src/app/page.tsx`: delete the `<p>{todayLabel()}</p>` line and the now-unused `todayLabel()` function. Header becomes just the H1 plus the Settings icon button, `items-center` instead of `items-start` (no longer needs top-alignment against a two-line block).

## 2. Capture sheet title style

`src/components/capture-sheet.tsx`: `DrawerTitle` goes from `text-center text-lg font-semibold tracking-tight` (Unbounded via the component's own default `font-heading` class) to `text-left font-sans text-[17px] font-semibold leading-6`. `font-sans` overrides the inherited `font-heading` (tailwind-merge dedups conflicting font-family utilities), switching it from Unbounded to Manrope. Left-alignment naturally lines up with the textarea below since both live inside the same 16px horizontal padding.

## 3. Task card meta-row — icons, reordered, no more label pill

`src/components/task-card.tsx`: the title row stops carrying `time` on its right side; `LABEL_STYLE` (the pill background) is removed entirely. A new meta-row renders under the title: `Calendar` icon + date (only for non-today/non-tomorrow deadlines, per the note above) → `Clock` icon + time (if present) → `Hash` icon + label text (colored via a new `LABEL_TEXT_COLOR` map, no pill background). All icons from `lucide-react`, `size={14}`, `strokeWidth={2}` — same stroke weight as the FAB/Settings icons from v3.

## 4. Unified primary button style

Applied via explicit Tailwind classes on each button (no new shared component, consistent with the project's existing decision not to introduce Button/Pill/Card abstractions): `h-14 w-full rounded-input px-6 py-4 text-base font-semibold`.
- `src/components/capture-sheet.tsx`: "Обробити" gets these classes (the shadcn `Button`'s own default height/padding are overridden by tailwind-merge).
- `src/components/welcome-screen.tsx`: "Почати" changes from a `rounded-full` auto-width pill to the same rectangular full-width style, wrapped in the same `max-w-xs` constraint as the paragraph above it so it doesn't stretch edge-to-edge on the centered Welcome layout.

## 5. Today/Tomorrow grouping (v5, resolves v4's open question)

No new screen, route, or navigation state — explicitly ruled out by v5 given the 22.07 deadline. In `page.tsx`:
```
todayTasks = sortTasks(visibleTasks).filter(t => t.deadline !== "tomorrow")
tomorrowTasks = sortTasks(visibleTasks).filter(t => t.deadline === "tomorrow")
```
`todayTasks` renders first with no section header (it's the screen's main content, per v5). If `tomorrowTasks` is non-empty, a section header renders above it: `Manrope 600, 13px, text-secondary, uppercase, tracking-wide, mt-6 mb-2`. If `tomorrowTasks` is empty, no header renders at all (no empty section). Stagger animation delay is a continuous index across both groups (`todayTasks.length + indexWithinTomorrow`) so the whole screen still reads as one sequential reveal, not two independent bursts.

**Edge case (not explicitly covered by v4/v5):** a task with a specific `YYYY-MM-DD` deadline that's neither `"today"` nor `"tomorrow"` falls into the `todayTasks` bucket (shown without a section header, same as a same-day task) and relies on the meta-row's calendar icon (point 3) to surface the actual date — this is the one case where that icon still earns its place.

## What's untouched

Colors/fonts/spacing/motion from v2, checkbox-as-priority-indicator and icon stroke consistency from v3, sort/soft-complete/AI-prompt logic — unchanged.

## Testing (manual)

1. Today header shows only "Сьогодні", no date line underneath.
2. Add a task with `deadline: tomorrow` via Capture — it appears under a "Завтра" section header, not mixed into the main list; the header text is uppercase, small, secondary-colored.
3. Add only same-day tasks (no tomorrow ones) — confirm no "Завтра" header renders at all (not even an empty one).
4. Task cards: label reads as plain colored text with a `#` icon, no pill background; time (if present) shows with a clock icon in the same row, not on the right edge of the title.
5. Capture sheet: "Що в голові?" title is left-aligned, visibly lighter/less bold-display than the H1 "Сьогодні" (Manrope vs Unbounded).
6. "Обробити" (Capture) and "Почати" (Welcome) are both full-width, same height (56px) — visually the same button component in two places.
7. Stagger: with tasks in both Today and Завтра sections, cards still reveal in one continuous sequence, not two separate resets.
