# Post-Audit UX Fixes — Design

> Джерело вимог: designer post-audit fix list, 19.07.2026. Усі 7 пунктів (1, 3, 4, 5, 6, 8, 9, 10 — нумерація зі списку дизайнера, п.2 вже виправлено раніше і не входить сюди).
> Дедлайн: 22.07.2026 12:00.

## Блок A — Швидкі фікси

**Backdrop click-through (п.1).** `CaptureSheet` додає `isOpening` стан (`useState(false)`). `useEffect` на `open`: коли `open` стає `true`, `setIsOpening(true)`, потім `setTimeout(() => setIsOpening(false), 300)`. Прокидаю `disablePointerDismissal={isOpening}` у `<Drawer>` root — це офіційний проп `@base-ui/react` Dialog/Drawer, що вимикає всі pointer-dismiss механізми (включно з тапом по backdrop) на час анімації відкриття.

**Padding контейнера (п.3).** Заголовки/контент екранів (Today, Settings, Inbox) переходять з `px-5` на `px-4` (16px) — єдиний горизонтальний відступ для всього застосунку.

**AI-промпт про час (п.8).** У `buildPrompt()` (`src/app/api/parse/route.ts`) додається один рядок перед "Повертай ТІЛЬКИ валідний JSON масив": інструкція не вигадувати `time`, якщо в тексті немає конкретної цифри. Решта промпту й JSON-контракт незмінні.

## Блок B — Сортування, soft-complete, Inbox delete/deadline

**Сортування Today** — нова чиста функція `sortTasks(tasks: Task[]): Task[]` у `src/lib/sort-tasks.ts`. Правило: задачі з `time` йдуть першими, відсортовані за зростанням часу (однаковий час → пріоритет high→medium→low як tie-break); задачі без `time` — у кінці списку, відсортовані за пріоритетом. `page.tsx` застосовує `sortTasks` перед рендером списку (сортування — похідна від стану, не окремий стан).

**Soft-complete toast.** Чекбокс більше не мутує `task.done` напряму в списку, що рендериться:
- `page.tsx` тримає `undoState: { task: Task; timeoutId: ReturnType<typeof setTimeout> } | null`
- Тап чекбокса → `setTasks` позначає задачу `done: true` (зберігається в localStorage як завжди), список Today рендерить `sortTasks(tasks.filter(t => !t.done))` — задача одразу зникає без анімації
- Одночасно `page.tsx` ставить `undoState` з копією задачі (для повернення) і `setTimeout(4000)`, що просто скидає `undoState` в `null` (сама задача вже `done: true` в `tasks`, нічого додатково робити не треба, коли таймер спливає)
- Новий компонент `src/components/undo-toast.tsx`: fixed над FAB, `aria-live="polite"`, рядок 1 (жирний, тапабельний) — "Скасувати", рядок 2 (сірий, менший) — "Виконано"
- Тап "Скасувати" → `clearTimeout(undoState.timeoutId)`, `setTasks` повертає `done: false` для тієї задачі, `undoState` → `null`
- Якщо юзер знімає ще один чекбокс, поки toast активний → старий `timeoutId` кліриться, `undoState` перезаписується новим (тільки одна активна undo-дія)

**Inbox delete (п.4).** На картці `InboxScreen` — кнопка "⋮" (icon-button) відкриває shadcn `DropdownMenu` (новий компонент, `npx shadcn add dropdown-menu`) з одним пунктом "Видалити задачу". Клік викликає `onDeleteTask(index)` → `pendingInboxTasks` фільтрується без цього індексу. Без confirm-діалогу. **Тільки в Inbox** — картки в Today без змін (за замовчуванням дизайнера).

**Inbox deadline (п.5).** Третій ряд pill-кнопок на картці Inbox (той самий візуальний патерн, що priority/label): "Сьогодні" / "Завтра", пише `{ deadline: "today" | "tomorrow" }` через існуючий `onChangeTask`. Довільна дата не додається.

## Блок C — Accessibility, дизайн-система

**Accessibility:**
- Крапка пріоритету (`TaskCard`) отримує `aria-label` ("Високий пріоритет" / "Середній пріоритет" / "Низький пріоритет"), `aria-hidden` прибирається; поруч додається короткий текстовий бейдж (перша літера: В/С/Н), щоб сенс не тримався тільки на кольорі
- Чекбокс: обгортка `p-2 -m-2` навколо `<input type="checkbox">` збільшує тап-зону до ~44×44px, візуальний розмір інпута не змінюється
- Checkbox (`<input type="checkbox">`) і Settings-тогл (shadcn `Switch`, `role="switch"` з коробки) вже семантично коректні — змін не потребують, тільки verification-крок
- `Drawer` (`@base-ui/react`) з коробки робить focus trap, Esc-close, autofocus першого фокусабельного елемента — verification-крок підтверджує, що фокус потрапляє саме в `Textarea`
- `UndoToast` отримує `aria-live="polite"`
- Контраст: `text-zinc-500` → `text-zinc-600` (light mode) для caption-тексту (дата, час, підказки) в усіх компонентах — `zinc-500` на фоні `zinc-50` на межі WCAG AA (4.5:1), `zinc-600` дає запас; dark mode (`zinc-400` на `black`) не чіпається — там контраст і так високий

**Дизайн-система (мінімальний токен-шар):**
- `globals.css`: новий `@theme` блок з іменованими алiасами на існуючу Tailwind-палітру (не нові кольори): `--color-priority-high: var(--color-red-500)`, `--color-priority-medium: var(--color-amber-500)`, `--color-priority-low: var(--color-zinc-400)`, `--color-label-work: var(--color-blue-500)`, `--color-label-work-bg: var(--color-blue-100)`, `--color-label-personal: var(--color-green-500)`, `--color-label-personal-bg: var(--color-green-100)`. Генерує утиліти `bg-priority-high`, `text-label-work` тощо. `TaskCard`/`InboxScreen` переходять на ці класи замість хардкоджених `bg-red-500` тощо.
- Radius: картки скрізь `rounded-2xl` (зараз місцями `rounded-xl` — приводиться до єдиного); pill/tag — `rounded-full` (вже консистентно)
- Spacing: `p-4` картки, `px-4` екрани (з Блоку A), `gap-3`/`gap-2` — стандартизується замість розкиданих ad hoc значень між компонентами
- Типографіка (документується, без нових CSS-класів — прямі Tailwind-класи): H1 `text-3xl font-bold` (тільки заголовок "Today"), H2 `text-2xl font-bold` (Settings/Inbox), body `text-base font-medium` (назва задачі), caption `text-sm text-zinc-600 dark:text-zinc-400` (дата/час/лейбли-підказки)
- Свідомо НЕ додаються окремі перевикористовувані React-компоненти (`Button`/`Pill`/`Card` abstractions) — токени кольору/radius/spacing дають основний ефект консистентності за менший час; повна компонентна абстракція — over-scope для часу, що лишився до дедлайну

## Тестування (ручне)

1. Швидко тапнути "+" кілька разів поспіль → sheet відкривається і лишається відкритим (не закривається сам собою)
2. Ввести текст без згадки часу ("купити хліб") → AI не підставляє вигаданий `time`
3. Візуально перевірити `px-4` на Today/Settings/Inbox — контент не впритул до країв
4. Позначити задачу виконаною → зникає зі списку, з'являється toast, тап "Скасувати" повертає задачу на місце в правильній позиції сортування; почекати 4с без дії → toast зникає, задача лишається `done`
5. Зняти чекбокс з другої задачі, поки перший toast ще активний → перший toast зникає, з'являється новий
6. Today з задачами різного часу/пріоритету → перевірити порядок: задачі з часом за зростанням, без часу — в кінці за пріоритетом
7. Inbox: відкрити "⋮" на картці → "Видалити задачу" → картка зникає зі списку; обрати "Сьогодні"/"Завтра" на картці → значення застосовується
8. Скрінрідер (VoiceOver/TalkBack) або DevTools accessibility tree: крапка пріоритету озвучується/показує aria-label; чекбокс і Switch розпізнаються як `checkbox`/`switch`; toast з'являється як `aria-live="polite"`
9. Tab-навігація в Capture sheet: фокус стартує в textarea, Tab не виходить за межі sheet, Esc закриває
10. DevTools contrast checker: `text-zinc-600` на `zinc-50` ≥ 4.5:1
