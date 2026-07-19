# Phase 4 — Settings + Inbox

> Джерело вимог: `PRODUCT_SPEC.md`, розділ 8, крок 7 (опційний, якщо залишився час).
> Розділи спеку: §3 (Екран 3 — Inbox, Екран 4 — Settings), §4 (Флоу C).

## Архітектура

- `src/components/settings-screen.tsx` — повноекранний компонент: заголовок "Settings", кнопка "Назад" (в Today), один тогл "Переглядати задачі перед додаванням". Props: `{ inboxEnabled: boolean; onToggleInbox: (v: boolean) => void; onBack: () => void }`.
- `src/components/inbox-screen.tsx` — повноекранний компонент: заголовок "Ось що ми знайшли", список задач з інлайн-редагуванням (назва — text input, пріоритет/лейбл — компактні сегментовані кнопки-селекти), кнопки "Додати все в Today" і "Назад". Props: `{ tasks: ParsedTask[]; onChangeTask: (index: number, patch: Partial<ParsedTask>) => void; onConfirm: () => void; onBack: () => void }`.
- `src/lib/storage.ts` — додаються `loadInboxEnabled(): boolean` / `saveInboxEnabled(v: boolean): void`, ключ `"inbox_enabled"` (за замовчуванням `false`, як вимагає спек §3).
- `src/components/capture-sheet.tsx` — стає **контрольованим** по тексту: `text`/`onTextChange` переносяться в props замість внутрішнього `useState`. Потрібно технічно (не косметично): щоб "Назад" в Inbox міг повернути юзера в Capture з тим самим текстом, текст має жити в `page.tsx`, а не губитись при закритті/відкритті sheet.
- `src/app/page.tsx` — новий стан: `screen: "today" | "settings" | "inbox"`, `captureText: string`, `pendingInboxTasks: ParsedTask[] | null`, `inboxEnabled: boolean | null` (гідратується так само, як `onboardingDone`, у тому ж ефекті).

## Потік даних

**Inbox вимкнено (за замовчуванням, як у Фазі 2-3):** Capture → `POST /api/parse` → `handleParsed` одразу додає задачі в `tasks`, чистить `captureText`, закриває sheet.

**Inbox увімкнено (Флоу C):** Capture → `POST /api/parse` → `handleParsed` кладе результат у `pendingInboxTasks`, закриває sheet, **не чистить** `captureText`, перемикає `screen` на `"inbox"`.
- В Inbox юзер редагує задачі через `onChangeTask(index, patch)`.
- "Додати все в Today" → `pendingInboxTasks` (з правками) додаються в `tasks`, `captureText` чиститься, `pendingInboxTasks` скидається в `null`, `screen` → `"today"`.
- "Назад" → `screen` → `"today"`, sheet відкривається знову (`sheetOpen = true`) з тим самим `captureText` — юзер редагує текст і тисне "Обробити" знову. `pendingInboxTasks` скидається в `null` (старий парсинг більше не актуальний).

**Settings:** іконка Settings у Today-хедері → `screen = "settings"`. Тогл читає/пише `inboxEnabled` через `loadInboxEnabled`/`saveInboxEnabled`. "Назад" → `screen = "today"`.

## Обробка помилок

- Помилка AI-парсингу (невдалий JSON/мережа) — без змін відносно Фази 2: людське повідомлення в Capture sheet, sheet не закривається, текст не втрачається. Працює однаково незалежно від того, увімкнений Inbox чи ні, бо `handleParsed` викликається тільки при успіху.
- `loadInboxEnabled`/`saveInboxEnabled` — той самий `try/catch`-патерн, що й інші функції `storage.ts` (graceful fallback на `false`, якщо localStorage недоступний).
- Inbox з порожнім `pendingInboxTasks` — неможливий стан за конструкцією (`handleParsed` завжди викликається з непорожнім масивом, бо route handler сам гарантує мінімум одну задачу), окремої обробки не потрібно.

## Стилі

- Settings: заголовок "Settings", тогл-перемикач (стандартний iOS-подібний switch), стиль узгоджений з Today/Welcome (zinc-палітра)
- Inbox: заголовок "Ось що ми знайшли", картки задач схожі на `TaskCard`, але з input замість статичного тексту й сегментованими кнопками замість кольорових індикаторів для priority/label
- Кнопки "Додати все в Today" (primary, чорна) і "Назад" (secondary, з рамкою)

## Тестування (ручне)

1. Settings вимкнено за замовчуванням → Capture → Today отримує задачі напряму (як у Фазі 2-3), Inbox не з'являється.
2. Увімкнути тогл в Settings → повернутись → Capture → перевірити, що після "Обробити" відкривається Inbox (не Today), з тими ж задачами що повернув AI.
3. В Inbox відредагувати назву однієї задачі та пріоритет іншої → "Додати все в Today" → перевірити, що в Today задачі з'явились із відредагованими значеннями.
4. Знову Capture з текстом → в Inbox тиснути "Назад" → перевірити, що Capture sheet відкрився з тим самим введеним текстом, відредагувати й повторно обробити.
5. Перезавантажити сторінку → перевірити, що стан тогла Inbox зберігся (localStorage).
